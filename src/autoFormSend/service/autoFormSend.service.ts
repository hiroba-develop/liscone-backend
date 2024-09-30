import { Injectable } from '@nestjs/common';
import {
  Builder,
  By,
  until,
  WebDriver,
  WebElement,
  Condition,
  error,
  Select,
} from 'selenium-webdriver';
import { Categories, ExtractedData } from '../entities/categorizedData.entity';
import { AutoFormSendLogEntity } from '../entities/autoFormSendLog.entity';
import { AutoFormSendEntity } from '../entities/autoFormSend.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as chrome from 'selenium-webdriver/chrome';
import axios from 'axios';

// 例外クラスのインポート
const {
  ElementClickInterceptedError,
  MoveTargetOutOfBoundsError,
  HTTPError,
  TimeoutError,
} = error;

@Injectable()
export class AutoFormSendService {
  constructor(
    @InjectRepository(AutoFormSendEntity)
    private autoFormSendRepository: Repository<AutoFormSendEntity>,

    @InjectRepository(AutoFormSendLogEntity)
    private autoFormSendLogRepository: Repository<AutoFormSendLogEntity>,

    private readonly dataSource: DataSource,
  ) {}

  async findByAutoFormSendList(
    companyCode: string,
  ): Promise<AutoFormSendEntity[]> {
    const query = this.autoFormSendRepository
      .createQueryBuilder('tb_auto_form_send')
      .innerJoinAndSelect(
        'tb_auto_form_send.autoFormSendLogs',
        'tb_auto_form_send_log',
      )
      .where('tb_auto_form_send.company_code = :companyCode', { companyCode });

    const response = await query.getMany();
    console.log(response);
    return response;
  }

  async updateSendStatus(
    corporation_url: string,
    form_list_no: string,
    sendStatus: string,
  ): Promise<void> {
    const updateResult = await this.autoFormSendLogRepository.update(
      { corporation_url, form_list_no },
      { send_status: sendStatus },
    );
  }

  async insertForm(data): Promise<string> {
    return await this.dataSource.transaction(async (manager) => {
      // 1. tb_auto_form_send テーブルに新しいレコードを挿入
      const autoFormSend = new AutoFormSendEntity();
      autoFormSend.form_list_name = data.inquiryData.taskName;
      autoFormSend.company_code = data.authUser.coId;
      autoFormSend.created_by = 'system';
      autoFormSend.modified_by = 'system';

      const savedAutoFormSend = await manager.save(autoFormSend);
      const newFormListNo = savedAutoFormSend.form_list_no;

      // 2. tb_auto_form_send_log テーブルに関連するログを挿入
      for (let i = 1; i < data.csvData.length; i++) {
        const autoFormSendLog = new AutoFormSendLogEntity();
        // console.log(data.csvData);
        const corporationId = data.csvData[i][0].trim(); // 法人番号を取り出して、trimで余分な空白を削除
        const corporationName = data.csvData[i][1].trim(); // 法人名を取り出して、trimで余分な空白を削除
        const corporationUrl = data.csvData[i][2].trim(); // 法人URLを取り出して、trimで余分な空白を削除
        autoFormSendLog.form_list_no = newFormListNo;
        autoFormSendLog.corporation_id = corporationId;
        autoFormSendLog.corporation_name = corporationName;
        autoFormSendLog.corporation_url = corporationUrl;
        autoFormSendLog.send_status = '-1';
        autoFormSendLog.created_by = 'system';
        autoFormSendLog.modified_by = 'system';
        autoFormSendLog.created = new Date();
        autoFormSendLog.modified = new Date();

        await manager.save(autoFormSendLog);
      }

      return newFormListNo;
    });
  }

  async form(data: any, InsertformResult: string): Promise<void> {
    // Chromeブラウザのオプションを設定
    const chromeOptions = new chrome.Options();
    chromeOptions.addArguments('--disable-gpu'); // GPUレンダリングを無効化
    chromeOptions.addArguments('--no-sandbox'); // サンドボックスモードを無効化
    chromeOptions.addArguments('--disable-dev-shm-usage'); // 開発者向け共有メモリの使用を無効化
    chromeOptions.addArguments('--headless');
    chromeOptions.addArguments('--window-size=1920,1080');

    // WebDriverのビルダーを使用してChromeドライバーをセットアップ
    const driver: WebDriver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOptions)
      .build();

    const printedElements = new Set<WebElement>(); // 印刷済みの要素を保持するためのセット
    const extractedData: ExtractedData[] = []; // 抽出された要素データを格納するリスト
    let foundAgreementCheckbox: boolean = false; // 同意チェックボックスが見つかったかどうかを示すフラグ
    const agreementDetails: any[] = []; // 同意チェックボックスに関する情報を格納するリスト
    let categorizedData;

    /**
     * 入力要素を特定するためのキーワードリストをカテゴリごとに定義します。
     */
    const inputKeywords: Record<string, string[]> = {
      departments: [
        'department',
        '部署',
        '事業部',
        '部',
        'busyo',
        'jigyoubu',
        '職種',
        'syokushu',
        '所属',
        'shozoku',
        'syozoku',
        'division',
        'job_category',
        'belongs',
        'your_job',
        'your-job',
        'job',
      ],
      positions: [
        'position',
        'ポジション',
        '役職',
        'yakushoku',
        'yakusyoku',
        '役職名',
        'jobtitle',
        'post',
      ],
      email_addresses: ['email', 'メール', 'mail', 'メールアドレス'],
      phone_numbers: ['phone', '電話', 'tel', '電話番号'],
      fax_numbers: ['fax', 'FAX'],
      company_names: [
        'company',
        '会社',
        'corp',
        '会社名',
        '法人',
        '法人名',
        '貴社',
        '組織',
        '団体名',
        '団体',
        'c-name',
        'c_name',
        'c name',
      ],
      employee_sizes: ['employee_sizes', 'employee', '従業員', '規模'],
      inquiry_genre: [
        '問い合わせ',
        '問合',
        '相談',
        '意見',
        'toiawase',
        'iken',
        'soudan',
        'detail',
        '内容',
        'descript',
        'メッセージ',
        'message',
        '本文',
        'inquiry',
        '件名',
        '題名',
        'title',
        'タイトル',
        'subject',
      ],
      address: ['県', '地域', 'prefecture', '勤務地', '地', '住所', 'address'],
      post_code: [
        '郵便番号',
        'post_code',
        'post code',
        'post-code',
        '〒',
        'zip',
        'ZIP',
      ],
      url: [
        'url',
        'URL',
        'HP',
        'ホームページ',
        'ページ',
        'サイト',
        'website',
        'site',
        'リンク',
        'link',
      ],
      industry: [
        '業種',
        'industry',
        'Industry',
        'gyousyu',
        'gyoushu',
        '業界',
        'gyoukai',
        'gyokai',
      ],
      how_found: ['知', 'きっかけ', '経路', 'kikkake'],
      introduction_time: [
        '導入',
        '時期',
        '検討',
        'dounyu',
        'time',
        'introduction',
        'when',
        'desired',
        'period',
      ],
      address_zip: [
        '郵便番号',
        'post_code',
        'post code',
        'post-code',
        '〒',
        'zip',
        'ZIP',
      ],
      address_city: ['市', '町', '村', '区', 'city'],
      address_prefecture: ['都道府県', '県', 'prefecture', 'pref'],
      address_street: [
        '番地',
        '住所',
        'address',
        '所在',
        'それ以降',
        'addr',
        '地',
        '勤務地',
        'ADDR',
      ],
      kanji_sei: ['last_name', '姓', '苗字', 'ラストネーム', 'last', 'sei'],
      kanji_mei: ['first_name', 'ファースト', 'first'],
      kanji_fullname: [
        'full_name',
        'name',
        '名前',
        '氏名',
        '担当者名',
        '名',
        'お名前',
        'フルネーム',
        'mei',
        'namae',
      ],
      kana_keywords: ['カナ', 'フリ', 'ruby', 'ガナ', 'kana', 'furi', 'kana'],
      hiragana_keywords: ['かな', 'ふり', 'ふりがな', 'ひらがな'],
      hiragana_sei: ['last_name', '姓', '苗字', 'ラストネーム', 'last', 'sei'],
      hiragana_mei: [
        'first_name',
        '名前',
        '名',
        'ファースト',
        'first',
        'mei',
        '氏名',
        'namae',
      ],
      hiragana_fullname: ['かな', 'ふり', 'ふりがな', 'ひらがな'],
      katakana: [
        'カナ',
        'フリ',
        'ruby',
        'ガナ',
        'kana',
        'furi',
        'kana',
        'セイ',
        'メイ',
      ],
      katakana_sei: [
        'last_name',
        '姓',
        '苗字',
        'ラストネーム',
        'last',
        'sei',
        'セイ',
      ],
      katakana_mei: [
        'first_name',
        '名前',
        '名',
        'ファースト',
        'first',
        'mei',
        '氏名',
        'namae',
        'メイ',
      ],
      katakana_fullname: [
        'full_name',
        'name',
        '名前',
        '氏名',
        '担当者名',
        '名',
        'お名前',
        'フルネーム',
        'カナ',
        'フリ',
        'ruby',
        'ガナ',
        'kana',
        'furi',
        'kana',
      ],
    };

    // 各csvDataに対してループ処理を行う
    for (let i = 1; i < data.csvData.length; i++) {
      let CSVurl = data.csvData[i][2].trim(); // 法人URLを取り出して、trimで余分な空白を削除
      try {
        // 役職のキーワードリストを作成
        let jobPositionKeywords = [];
        if (data.inquiryData.jobPosition === '経営者') {
          jobPositionKeywords = ['経営', '社長', '代表', 'その他'];
        }
        if (data.inquiryData.jobPosition === '役員') {
          jobPositionKeywords = [
            '役員',
            '経営',
            '取締',
            '役',
            '執行',
            'その他',
          ];
        }
        if (data.inquiryData.jobPosition === '部長') {
          jobPositionKeywords = ['部長', '本部', '責任', 'その他'];
        }
        if (data.inquiryData.jobPosition === '課長') {
          jobPositionKeywords = [
            '課長',
            '係長',
            'マネージャー',
            'リーダー',
            'その他',
          ];
        }
        if (data.inquiryData.jobPosition === '一般') {
          jobPositionKeywords = ['一般', '社員', 'なし', 'その他'];
        }

        // 部署のキーワードリストを作成
        let departmentKeywords = [];
        if (data.inquiryData.department === '営業') {
          departmentKeywords = ['セールス', '営業', 'その他'];
        }
        if (data.inquiryData.department === 'マーケティング') {
          departmentKeywords = ['マーケ', '広報', 'その他'];
        }
        if (data.inquiryData.department === '広報') {
          departmentKeywords = ['広報', 'マーケ', 'その他'];
        }
        if (data.inquiryData.department === '人事,労務') {
          departmentKeywords = ['人事', '労務', '採用', '教育', 'その他'];
        }
        if (data.inquiryData.department === '総務') {
          departmentKeywords = ['総務', 'その他'];
        }
        if (data.inquiryData.department === '経理') {
          departmentKeywords = ['経理', 'その他'];
        }
        if (data.inquiryData.department === '経営企画') {
          departmentKeywords = ['経営', '企画', '社長室', '管理', 'その他'];
        }
        if (data.inquiryData.department === 'CS') {
          departmentKeywords = ['CS', 'カスタマー', 'コンサル', 'その他'];
        }
        if (data.inquiryData.department === '開発') {
          departmentKeywords = ['開発', '研究', 'エンジニア', 'その他'];
        }

        // 業種のキーワードリストを作成
        let industryTypeKeywords = [];
        if (data.inquiryData.industryType === '農林・水産') {
          industryTypeKeywords = [
            '農業',
            '林業',
            '水産',
            '園芸',
            '素材生産',
            '養殖',
            '木材',
            'その他',
          ];
        }
        if (data.inquiryData.industryType === '鉱業') {
          industryTypeKeywords = [
            '鉱業',
            '鉄鋼',
            '金属',
            '鉄',
            '石炭',
            '原油',
            'その他',
          ];
        }
        if (data.inquiryData.industryType === '建設') {
          industryTypeKeywords = [
            '建設',
            '建築',
            '工事',
            '設備',
            '大工',
            '塗装',
            '木材',
            'その他',
          ];
        }
        if (data.inquiryData.industryType === '製造') {
          industryTypeKeywords = [
            '製造',
            '製',
            '食品',
            '飲料',
            '繊維',
            'たばこ',
            '紙',
            '家具',
            '衣類',
            '化学',
            '工業',
            '自動車',
            '部品',
            '車',
            '工場',
            'その他',
          ];
        }
        if (data.inquiryData.industryType === '出版・印刷') {
          industryTypeKeywords = [
            '新聞',
            '出版',
            '印刷',
            'メディア',
            '製版',
            'マスコミ',
            'その他',
          ];
        }
        if (data.inquiryData.industryType === '医療・介護') {
          industryTypeKeywords = [
            '医',
            '医療',
            '介護',
            '看護',
            '病院',
            'その他',
          ];
        }
        if (data.inquiryData.industryType === '電気・ガス') {
          industryTypeKeywords = [
            '電気',
            'ガス',
            'エネルギー',
            '電',
            '水道',
            '熱供給',
            'その他',
          ];
        }
        if (data.inquiryData.industryType === '運輸・通信') {
          industryTypeKeywords = [
            '運輸',
            '運送',
            '運搬',
            '空',
            '鉄道',
            '旅客',
            '道路',
            '貨物',
            '空港',
            '航空',
            '倉庫',
            '物流',
            'その他',
          ];
        }
        if (data.inquiryData.industryType === '卸売・小売') {
          industryTypeKeywords = [
            '小売',
            '卸',
            '卸売',
            'EC',
            'コマース',
            '店舗',
            '店',
            'その他',
          ];
        }
        if (data.inquiryData.industryType === '飲食・宿泊') {
          industryTypeKeywords = ['飲食', '宿泊', 'サービス', '店', 'その他'];
        }
        if (data.inquiryData.industryType === '金融・保険業') {
          industryTypeKeywords = [
            '金融',
            '保険',
            '銀行',
            'バンク',
            '財務',
            '会計',
            '経理',
            '信託',
            '金庫',
            '投資',
            'その他',
          ];
        }
        if (data.inquiryData.industryType === '不動産') {
          industryTypeKeywords = [
            '不動産',
            '住宅',
            'マンション',
            '賃貸',
            '土地',
            'その他',
          ];
        }
        if (data.inquiryData.industryType === 'サービス') {
          industryTypeKeywords = [
            'サービス',
            '店',
            '飲食',
            '宿泊',
            '映画',
            '娯楽',
            'アパレル',
            '玩具',
            '駐車',
            'その他',
          ];
        }
        if (data.inquiryData.industryType === 'IT・広告') {
          industryTypeKeywords = [
            '情報通信',
            'IT',
            '情報',
            '広告',
            '代理店',
            '放送',
            'ニュース',
            'その他',
          ];
        }
        if (data.inquiryData.industryType === 'コンサル・会計・法務関連') {
          industryTypeKeywords = [
            'コンサル',
            '専門',
            '会計',
            '法務',
            '無形',
            'その他',
          ];
        }
        if (data.inquiryData.industryType === '人材・教育') {
          industryTypeKeywords = [
            '人材',
            '人事',
            '労務',
            '採用',
            '教育',
            '人材紹介',
            'エージェント',
            '学習',
            'その他',
          ];
        }
        if (data.inquiryData.industryType === '官公庁・団体') {
          industryTypeKeywords = [
            '官公庁',
            '自治体',
            '公',
            '団体',
            '教会',
            'その他',
          ];
        }
        if (data.inquiryData.industryType === 'その他') {
          industryTypeKeywords = ['その他', '該当'];
        }

        // 従業員規模のキーワードリストを作成
        let employeeSizesKeywords = [];
        if (data.inquiryData.employeeSize === '1~10') {
          employeeSizesKeywords = [
            '1',
            '10',
            '5',
            '25',
            '24',
            '29',
            '10',
            '20',
            '30',
          ];
        }

        if (data.inquiryData.employeeSize === '10~30') {
          employeeSizesKeywords = [
            '25',
            '24',
            '29',
            '10',
            '20',
            '30',
            '31',
            '49',
            '51',
            '30',
            '40',
            '50',
          ];
        }

        if (data.inquiryData.employeeSize === '30~50') {
          employeeSizesKeywords = [
            '31',
            '49',
            '51',
            '30',
            '40',
            '50',
            '51',
            '99',
            '75',
            '50',
            '100',
          ];
        }

        if (data.inquiryData.employeeSize === '50~100') {
          employeeSizesKeywords = [
            '51',
            '99',
            '75',
            '50',
            '100',
            '101',
            '299',
            '199',
            '249',
            '100',
            '150',
            '200',
            '250',
            '300',
          ];
        }

        if (data.inquiryData.employeeSize === '100~300') {
          employeeSizesKeywords = [
            '101',
            '299',
            '199',
            '249',
            '100',
            '150',
            '200',
            '250',
            '300',
            '301',
            '499',
            '399',
            '449',
            '300',
            '350',
            '400',
            '450',
            '500',
          ];
        }

        if (data.inquiryData.employeeSize === '300~500') {
          employeeSizesKeywords = [
            '301',
            '499',
            '399',
            '449',
            '300',
            '350',
            '400',
            '450',
            '500',
            '501',
            '999',
            '599',
            '500',
            '550',
            '600',
            '650',
            '700',
            '750',
            '800',
            '850',
            '900',
            '950',
          ];
        }

        if (data.inquiryData.employeeSize === '500~1000') {
          employeeSizesKeywords = [
            '501',
            '999',
            '599',
            '500',
            '550',
            '600',
            '650',
            '700',
            '750',
            '800',
            '850',
            '900',
            '950',
            '999',
            '1000',
            '1001',
          ];
        }

        if (data.inquiryData.employeeSize === '1000~') {
          employeeSizesKeywords = ['999', '1000', '1001'];
        }

        // キーワードを定義
        const Keywords: { [category: string]: string[] } = {
          inquiry_genre: [
            '営業',
            'ご紹介',
            '提案',
            '協業',
            '提携',
            'その他',
            'ご相談',
            'お問い合わせ',
            '取材',
          ],
          how_found: ['検索', 'その他', 'セールス'],
          departments: departmentKeywords, // 変数 部署★
          employee_sizes: employeeSizesKeywords, // 変数 従業員数★
          positions: jobPositionKeywords, // 変数 役職★
          address: [data.inquiryData.prefecture], // 変数 住所(都道府県のみ)★
          industry: industryTypeKeywords, // 変数 業種★
          address_prefecture: [data.inquiryData.prefecture], // 変数 住所(都道府県のみ)
          introduction_time: ['検討', '未定', 'その他', '情報収集'],
        };

        let url = CSVurl;
        // URLがhttpまたはhttpsを含んでいるかチェックし、含まない場合はhttp://を付与
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'http://' + url;
        }
        // 指定されたURLにアクセス
        await driver.get(url);

        // ページが読み込まれるまで待機（ミリ秒単位）
        await driver.sleep(3000); // 10秒待機

        //ページのcookieを削除する
        await this.closeCookieBanner(driver);

        // フォームがあるページを検索する関数群
        let findAndClickContactInHamburgerMenuerrorFlg: number =
          await this.findAndClickContactInHamburgerMenu(driver);
        let findContactLinkAndClick2Flg: number =
          await this.findContactLinkAndClick2(driver);
        let clickContactLinkIfClickableFlg: number =
          await this.clickContactLinkIfClickable(driver);
        let clickPageElementsFlg: number = await this.clickPageElements(driver);
        let clickContactLinkIfContactCheckFlg: number =
          await this.clickContactLinkIfContactCheck(driver);
        await this.mainpageKeywordClick(driver);

        if (
          findAndClickContactInHamburgerMenuerrorFlg === undefined ||
          findContactLinkAndClick2Flg === undefined ||
          clickContactLinkIfClickableFlg === undefined ||
          clickPageElementsFlg === undefined ||
          clickContactLinkIfContactCheckFlg === undefined
        ) {
          console.log('お問い合わせフォーム検出。フォーム入力処理を行います。');
          await this.clearCache(driver);
          // ページ内、またはiframe内のすべてのチェックボックス・ラジオボタンを該当するキーワードでチェックして、クリックする
          await this.switchToIframeAndHandleAllCheckboxes(driver, Keywords);
          await this.switchToIframeAndHandleAllRadioButtons(driver, Keywords);

          // ページの一番下までスクロール
          await driver.executeScript(
            'window.scrollTo(0, document.body.scrollHeight);',
          );
          // ページ上のすべての要素を取得
          const pageElements: WebElement[] = await driver.findElements(
            By.xpath('//*'),
          );
          // フォーム要素を格納するリスト
          const formElements: WebElement[] = [];
          for (const el of pageElements) {
            try {
              const text = await el.getText();
              // テキストに'form'または'フォーム'が含まれているかチェック
              if (
                text.toLowerCase().includes('form') ||
                text.includes('フォーム')
              ) {
                formElements.push(el); // フォーム要素をリストに追加
              }
            } catch (e) {
              if (e instanceof error.StaleElementReferenceError) {
                // console.log('Stale element detected, retrying...'); // ステールエレメント例外が発生した場合にリトライのメッセージを表示
              } else {
                throw e;
              }
            }
          }

          await this.handleCheckboxElements(driver, extractedData, Keywords);
          await this.handleRadioElements(driver, extractedData, Keywords);

          await this.processSelectElementsWithIframes(
            driver,
            extractedData,
            Keywords,
          );

          await this.handleAgreementCheckbox(driver);

          await this.handleRadioButtons(driver, extractedData, Keywords);
          await this.handleSelectElements(driver, extractedData, Keywords);

          categorizedData = await this.categorizeData(extractedData);

          // 抽出したデータを表示
          console.log('抽出したデータ:');
          console.log(JSON.stringify(extractedData, null, 2)); // 抽出したフォーム要素のデータを見やすい形式で表示

          // // 分類されたデータを表示
          // console.log('\nカテゴリー:');
          // console.log(JSON.stringify(categorizedData, null, 2)); // カテゴリごとに分類されたフォーム要素データを表示

          await this.handleFormElementsAndSearchCheckboxes(
            driver,
            formElements,
            printedElements,
            extractedData,
            agreementDetails,
            foundAgreementCheckbox,
            data.inquiryData.inquiryBody,
          );
          if (foundAgreementCheckbox) {
            console.log('\n同意または間違いチェックボックスが検出されました:');
            for (const detail of agreementDetails) {
              console.log(
                `ラベルテキスト: ${detail.labelText}, チェックされているか: ${detail.isSelected}`,
              );
            }
          } else {
            console.log(
              '\n同意または間違いチェックボックスは検出されませんでした。',
            );
          }
          await this.inputTextToTextarea(
            driver,
            extractedData,
            data.inquiryData.inquiryBody,
          );
          await this.processTextareas(driver, data.inquiryData.inquiryBody);

          // iframeを取得
          const iframes: WebElement[] = await driver.findElements(
            By.tagName('iframe'),
          );

          await this.handleIframeTextareaElements(
            driver,
            iframes,
            data.inquiryData.inquiryBody,
          );
          categorizedData = await this.categorizeData(extractedData);

          // placeholder属性を確認して入力を行う
          await this.handleInputPlaceholderElements(driver, data.inquiryData);

          // dlタグに対応するもの
          await this.handleAddressInputDefinitionListElements(
            driver,
            data.inquiryData,
          );
          await this.handleDepartmentInputDefinitionListElements(
            driver,
            data.inquiryData,
          );
          await this.handleCorporateNameInputDefinitionListElements(
            driver,
            data.inquiryData,
          );

          // tableタグに対応するもの
          await this.handleaddressInputTableElements(driver, data.inquiryData);
          await this.handleDepartmentInputTableElements(
            driver,
            data.inquiryData,
          );
          await this.handleCorporateNameInputTableElements(
            driver,
            data.inquiryData,
          );

          await this.handleIframeInputAndTextareaElements(
            driver,
            iframes,
            printedElements,
            extractedData,
            data.inquiryData.emailAddress,
            data.inquiryData.phoneNumber,
            data.inquiryData.inquiryBody,
          );

          // 実際にフォームに値を設定する処理
          await this.inputEmailAddresses(
            driver,
            categorizedData,
            iframes,
            data.inquiryData.emailAddress,
          );
          await this.inputFaxNumbers(
            driver,
            categorizedData,
            data.inquiryData.fax,
          );
          await this.inputFaxNumbers2(
            driver,
            categorizedData,
            data.inquiryData.fax,
          );
          await this.inputPhoneNumbers(
            driver,
            categorizedData,
            data.inquiryData.phoneNumber,
          );
          await this.inputPhoneNumbers2(
            driver,
            categorizedData,
            data.inquiryData.phoneNumber,
          );
          await this.inputPostCode(
            driver,
            categorizedData,
            data.inquiryData.postalCode,
          );
          await this.inputPostCode2(
            driver,
            categorizedData,
            data.inquiryData.postalCode,
          );
          await this.inputCompanyName(
            driver,
            categorizedData,
            data.inquiryData.corporateName,
          );
          await this.inputDepartments(
            driver,
            categorizedData,
            data.inquiryData.department,
          );
          await this.selectDepartments(
            driver,
            categorizedData,
            departmentKeywords,
          );
          await this.inputIntroductionTime(driver, categorizedData);
          await this.selectIntroductionTime(driver, categorizedData);
          await this.inputHowFound(driver, categorizedData);
          await this.selectHowFound(driver, categorizedData);
          await this.inputPositions(
            driver,
            categorizedData,
            data.inquiryData.jobPosition,
          );
          await this.selectPositions(
            driver,
            categorizedData,
            data.inquiryData.jobPosition,
          );
          await this.inputIndustry(
            driver,
            categorizedData,
            data.inquiryData.industryType,
          );
          await this.selectIndustry(
            driver,
            categorizedData,
            industryTypeKeywords,
          );
          await this.inputEmployeeSizes(
            driver,
            categorizedData,
            data.inquiryData.employeeSize,
          );
          await this.selectEmployeeSizes(
            driver,
            categorizedData,
            employeeSizesKeywords,
          );
          await this.inputUrl(
            driver,
            categorizedData,
            data.inquiryData.myCorporateURL,
          );
          await this.inputInquiryGenre(
            driver,
            categorizedData,
            data.inquiryData.inquirySubject,
          );
          await this.selectInquiryGenre(driver, categorizedData);
          await this.inputAddress(
            driver,
            categorizedData,
            data.inquiryData.prefecture,
            data.inquiryData.city,
            data.inquiryData.streetAddress,
            data.inquiryData.buildingName,
          );
          await this.inputAddressZip(
            driver,
            categorizedData,
            data.inquiryData.postalCode,
          );
          await this.inputAddressCity(
            driver,
            categorizedData,
            data.inquiryData.city,
          );
          await this.inputAddressPrefecture(
            driver,
            categorizedData,
            data.inquiryData.prefecture,
          );
          await this.inputAddressStreet(
            driver,
            categorizedData,
            data.inquiryData.streetAddress,
          );
          await this.selectAddress(
            driver,
            categorizedData,
            data.inquiryData.prefecture,
          );
          await this.selectAddressPrefecture(
            driver,
            categorizedData,
            data.inquiryData.prefecture,
          );
          await this.inputPostCodeInIframe(
            driver,
            categorizedData,
            iframes,
            data.inquiryData.postalCode,
          );
          await this.inputPostCodeInIframe2(
            driver,
            categorizedData,
            iframes,
            data.inquiryData.postalCode,
          );
          await this.inputCompanyNameInIframe(
            driver,
            categorizedData,
            iframes,
            data.inquiryData.corporateName,
          );
          await this.inputIntroductionTimeInIframe(
            driver,
            categorizedData,
            iframes,
          );
          await this.selectIntroductionTimeInIframe(
            driver,
            categorizedData,
            iframes,
          );
          await this.inputDepartmentsInIframe(
            driver,
            categorizedData,
            iframes,
            data.inquiryData.department,
          );
          await this.selectDepartmentsInIframe(
            driver,
            categorizedData,
            iframes,
            departmentKeywords,
          );
          await this.inputEmployeeSizesInIframe(
            driver,
            categorizedData,
            iframes,
            data.inquiryData.employeeSize,
          );
          await this.selectEmployeeSizesInIframe(
            driver,
            categorizedData,
            iframes,
            employeeSizesKeywords,
          );
          await this.inputUrlInIframe(
            driver,
            categorizedData,
            iframes,
            data.inquiryData.myCorporateURL,
          );
          await this.inputPositionsInIframe(
            driver,
            categorizedData,
            iframes,
            data.inquiryData.jobPosition,
          );
          await this.selectPositionsInIframe(
            driver,
            categorizedData,
            iframes,
            jobPositionKeywords,
          );
          await this.inputIndustryInIframe(
            driver,
            categorizedData,
            iframes,
            data.inquiryData.industryType,
          );
          await this.selectIndustryInIframe(
            driver,
            categorizedData,
            iframes,
            industryTypeKeywords,
          );
          await this.inputHowFoundInIframe(driver, categorizedData, iframes);
          await this.selectHowFoundInIframe(driver, categorizedData, iframes);
          await this.inputInquiryGenreInIframe(
            driver,
            categorizedData,
            iframes,
            data.inquiryData.inquirySubject,
          );
          await this.selectInquiryGenreInIframe(
            driver,
            categorizedData,
            iframes,
          );
          await this.inputAddressInIframe(
            driver,
            categorizedData,
            iframes,
            data.inquiryData.prefecture,
            data.inquiryData.city,
            data.inquiryData.streetAddress,
            data.inquiryData.buildingName,
          );
          await this.inputAddressPrefectureInIframe(
            driver,
            categorizedData,
            iframes,
            data.inquiryData.prefecture,
          );
          await this.inputAddressCityInIframe(
            driver,
            categorizedData,
            iframes,
            data.inquiryData.city,
          );
          await this.inputAddressZipInIframe(
            driver,
            categorizedData,
            iframes,
            data.inquiryData.postalCode,
          );
          await this.inputAddressStreetInIframe(
            driver,
            categorizedData,
            iframes,
            data.inquiryData.streetAddress,
          );
          await this.selectAddressInIframe(
            driver,
            categorizedData,
            iframes,
            data.inquiryData.prefecture,
          );
          await this.selectAddressPrefectureInIframe(
            driver,
            categorizedData,
            iframes,
            data.inquiryData.prefecture,
          );

          // 名前入力
          await this.handleNameInputDefinitionListElements(
            driver,
            data.inquiryData,
          );
          await this.handleNameInputTableElements(driver, data.inquiryData);
          // await this.handleNameInputBrotherElements(driver, data.inquiryData);
          await this.handleNameInputElements(driver, data.inquiryData);
          await this.inputKanjiSei(
            driver,
            categorizedData,
            data.inquiryData.lastName,
          );
          await this.inputKanjiFullname(
            driver,
            categorizedData,
            data.inquiryData.lastName,
            data.inquiryData.firstName,
          );
          await this.inputKanjiMei(
            driver,
            categorizedData,
            data.inquiryData.firstName,
          );
          await this.inputKatakanaSei(
            driver,
            categorizedData,
            data.inquiryData.lastNameKatakana,
          );
          await this.inputKatakanaFullname(
            driver,
            categorizedData,
            data.inquiryData.lastNameKatakana,
            data.inquiryData.firstNameKatakana,
          );
          await this.inputKatakanaMei(
            driver,
            categorizedData,
            data.inquiryData.firstNameKatakana,
          );
          await this.inputHiraganaSei(
            driver,
            categorizedData,
            data.inquiryData.lastNameHiragana,
          );
          await this.inputHiraganaFullname(
            driver,
            categorizedData,
            data.inquiryData.lastNameHiragana,
            data.inquiryData.firstNameHiragana,
          );
          await this.inputHiraganaMei(
            driver,
            categorizedData,
            data.inquiryData.firstNameHiragana,
          );
          await this.inputKanjiSeiInIframe(
            driver,
            categorizedData,
            iframes,
            data.inquiryData.lastName,
          );
          await this.inputKanjiFullnameInIframe(
            driver,
            categorizedData,
            iframes,
            data.inquiryData.lastName,
            data.inquiryData.firstName,
          );
          await this.inputKanjiMeiInIframe(
            driver,
            categorizedData,
            iframes,
            data.inquiryData.firstName,
          );
          await this.inputKatakanaSeiInIframe(
            driver,
            categorizedData,
            iframes,
            data.inquiryData.lastNameKatakana,
          );
          await this.inputKatakanaFullnameInIframe(
            driver,
            categorizedData,
            iframes,
            data.inquiryData.lastNameKatakana,
            data.inquiryData.firstNameKatakana,
          );
          await this.inputKatakanaMeiInIframe(
            driver,
            categorizedData,
            iframes,
            data.inquiryData.firstNameKatakana,
          );
          await this.inputHiraganaSeiInIframe(
            driver,
            categorizedData,
            iframes,
            data.inquiryData.lastNameHiragana,
          );
          await this.inputHiraganaFullnameInIframe(
            driver,
            categorizedData,
            iframes,
            data.inquiryData.lastNameHiragana,
            data.inquiryData.firstNameHiragana,
          );
          await this.inputHiraganaMeiInIframe(
            driver,
            categorizedData,
            iframes,
            data.inquiryData.firstNameHiragana,
          );

          // 入力が読み込まれるまで2秒待機（ミリ秒単位）
          await driver.sleep(2000);

          await this.handleAgreementCheckboxesCombined(driver, extractedData);

          await this.processInputsAndTextareas2(
            driver,
            inputKeywords,
            extractedData,
            data.inquiryData,
          );

          // お問い合わせフォームの送信ボタンを検出してクリックします。クリック成功でTrue
          const clickSendButton: boolean = await this.isClickSendButton(
            driver,
            url,
          );
          if (clickSendButton) {
            // 入力項目エラー画面が表示されているかを検出（最大3秒）
            const inputErrorDisplayed: boolean = await driver
              .wait(async () => {
                return await this.isInputErrorDisplayed(driver);
              }, 3000)
              .catch(() => false);

            if (inputErrorDisplayed) {
              // 確認画面が表示されるまで待機します（最大3秒）
              const confirmationDisplayed: boolean = await driver
                .wait(async () => {
                  return await this.isConfirmationScreenDisplayed(driver);
                }, 3000)
                .catch(() => false);

              if (confirmationDisplayed) {
                // 確認画面が表示された場合、再度送信ボタンをクリックします
                await this.isClickSendButton(driver, url);
              } else {
                console.log('確認画面は表示されませんでした。');
              }

              // 送信完了画面が表示されるまで待機します（最大3秒）
              const sendCompleteDisplayed: boolean = await driver
                .wait(async () => {
                  return await this.isSendCompleteScreenDisplayed(driver);
                }, 3000)
                .catch(() => false);

              if (sendCompleteDisplayed) {
                console.log('お問い合わせフォームの送信が完了しました。');
                await this.updateSendStatus(CSVurl, InsertformResult, '0');
              } else {
                console.log('送信完了画面は表示されませんでした。');
                await this.updateSendStatus(CSVurl, InsertformResult, '4');
              }
            } else {
              console.log('入力項目に不備がありました。');
              await this.updateSendStatus(CSVurl, InsertformResult, '3');
            }
          } else {
            console.log('送信ボタンが見つかりませんでした。');
            await this.updateSendStatus(CSVurl, InsertformResult, '2');
          }

          // // 抽出したデータを表示
          // console.log('抽出したデータ:');
          // console.log(JSON.stringify(extractedData, null, 2)); // 抽出したフォーム要素のデータを見やすい形式で表示

          // // 分類されたデータを表示
          // console.log('\nカテゴリー:');
          // console.log(JSON.stringify(categorizedData, null, 2)); // カテゴリごとに分類されたフォーム要素データを表示

          // 5秒間待機
          await driver.sleep(5000);
        } else {
          console.log('お問い合わせフォームが見つかりません。');
          await this.updateSendStatus(CSVurl, InsertformResult, '1');
        }
      } catch (error) {
        console.error('不明なエラーが発生しました:', error);
        await this.updateSendStatus(CSVurl, InsertformResult, '5');
      }
    }
    // ブラウザを閉じる
    await driver.quit();
  }

  /**
   * クッキーバナーを閉じる、または削除する
   * @param driver Selenium WebDriverのインスタンス
   */
  async closeCookieBanner(driver: WebDriver): Promise<void> {
    try {
      // クッキーバナーを特定
      const cookieBanner: WebElement = await driver.wait(
        until.elementLocated(By.id('hs-eu-cookie-confirmation-inner')),
        3000,
      );

      // 複数の可能なパスを試す
      let closeButton: WebElement | null = null;

      try {
        closeButton = await cookieBanner.findElement(
          By.xpath("//a[contains(@class, 'hs-eu-confirmation-accept')]"),
        );
      } catch (err) {
        if (err instanceof error.NoSuchElementError) {
          try {
            closeButton = await cookieBanner.findElement(
              By.xpath(
                "//button[contains(@class, 'hs-eu-confirmation-accept')]",
              ),
            );
          } catch (err) {
            if (err instanceof error.NoSuchElementError) {
              try {
                closeButton = await cookieBanner.findElement(
                  By.className('hs-eu-confirmation-accept'),
                );
              } catch (err) {
                if (err instanceof error.NoSuchElementError) {
                  console.log('クッキーバナーの閉じるボタンが見つかりません');
                } else {
                  throw err;
                }
              }
            } else {
              throw err;
            }
          }
        } else {
          throw err;
        }
      }

      if (closeButton) {
        await closeButton.click(); // クッキーバナーの「OK」ボタンをクリック
        console.log('クッキーバナーを閉じました');
        // クッキーバナーが閉じられるまで待機
        await driver.wait(until.stalenessOf(cookieBanner), 3000);
      } else {
        console.log(
          'クッキーバナーの閉じるボタンが見つかりません、DOMから削除を試みます',
        );
        // 閉じるボタンが見つからない場合、DOMから削除
        await this.removeCookieBannerWithJS(driver);
      }
    } catch (err) {
      if (err instanceof error.TimeoutError) {
        console.log('クッキーバナーが見つからないか、すでに閉じられています');
      } else {
        console.error(`クッキーバナーを閉じる際のエラー: ${err}`);
      }
      // エラー発生時にDOMから削除を試みる
      await this.removeCookieBannerWithJS(driver);
    }
  }

  /**
   * DOMを使ってクッキーバナーを完全に削除する関数
   * @param driver Selenium WebDriverのインスタンス
   */
  async removeCookieBannerWithJS(driver: WebDriver): Promise<void> {
    try {
      const result = await driver.executeScript<string>(`
      let banner = document.getElementById('hs-eu-cookie-confirmation-inner');
      if (banner) {
          banner.remove();  // クッキーバナーをDOMから完全に削除
          return 'DOMでクッキーバナーを削除しました';
      } else {
          return 'DOMでクッキーバナーを見つけられませんでした';
      }
    `);
      console.log(result);
    } catch (err) {
      console.error(`DOMによるクッキーバナーの削除エラー: ${err}`);
    }
  }

  /**
   * ハンバーガーメニューの中から「お問い合わせ」要素を探し、クリックする関数
   * @param driver Selenium WebDriverのインスタンス
   */
  async findAndClickContactInHamburgerMenu(driver: WebDriver): Promise<number> {
    try {
      // ハンバーガーメニューを開くボタンを探す
      const hamburgerButton: WebElement = await driver.wait(
        until.elementLocated(By.css('.hamburger-icon')), // CSSセレクタでハンバーガーアイコンを指定
        3000,
      );

      // ハンバーガーメニューが表示されていない場合、ボタンをクリックしてメニューを表示
      if (!(await hamburgerButton.isDisplayed())) {
        console.log('ハンバーガーメニューボタンが検出されませんでした');
      } else {
        await hamburgerButton.click();
        console.log(
          'ハンバーガーメニューボタンが表示されたのでクリックしました',
        );
        await driver.sleep(2000); // メニューが表示されるまで短いスリープを挟む
      }

      // メニュー内にある「お問い合わせ」リンクを探す
      const contactLinkXPath =
        "//nav//a[contains(text(), 'お問い合わせ') or contains(@href, 'contact')]";
      const contactLink: WebElement = await driver.wait(
        until.elementLocated(By.xpath(contactLinkXPath)),
        3000,
      );

      console.log(
        'Contact link found in hamburger menu: ',
        await contactLink.getText(),
      );

      // スクロールして要素を可視化し、クリック
      await driver.executeScript(
        'arguments[0].scrollIntoView(true);',
        contactLink,
      );
      await contactLink.click();

      // ページの読み込み完了を待機
      await driver.wait(async () => {
        const readyState = await driver.executeScript(
          'return document.readyState',
        );
        return readyState === 'complete';
      }, 3000);

      await driver.sleep(1000); // 短いスリープを挟む

      const currentUrl = await driver.getCurrentUrl(); // 現在のURLを取得
      console.log('Current URL after click (if any): ', currentUrl);
    } catch (err) {
      if (err instanceof error.TimeoutError) {
        console.log('お問い合わせリンクはハンバーガーメニューにありません。');
        return 1;
      } else if (err instanceof error.ElementClickInterceptedError) {
        console.log(
          'クリックが出来なかったので、DOMに対して、強制クリックを試みます',
        );
        try {
          const contactLink: WebElement = await driver.findElement(
            By.xpath(
              "//nav//a[contains(text(), 'お問い合わせ') or contains(@href, 'contact')]",
            ),
          );
          await driver.executeScript('arguments[0].click();', contactLink); // 仮想DOMに対して、強制クリック
          console.log('DOMを使用してお問い合わせリンクをクリック');
        } catch (jsErr) {
          console.error('DOMクリックに失敗:', jsErr);
          return 1;
        }
      } else if (err instanceof error.StaleElementReferenceError) {
        console.log('古い参照が検出されたため、再試行します');
        await this.findAndClickContactInHamburgerMenu(driver); // 再帰的に関数を呼び出す
      } else {
        console.error(
          `ハンバーガーメニューでコンタクトを検索してクリックする際のエラー: ${err}`,
        );
        return 1;
      }
    }
  }

  /**
   * メニューまたはページ全体から「お問い合わせ」リンクを検索し、クリックする関数
   * @param driver - Selenium WebDriverのインスタンス
   */
  async findContactLinkAndClick2(driver: WebDriver): Promise<number> {
    try {
      // メニュー内で「お問い合わせ」リンクを検索 (テキストか href 属性に 'contact' を含む)
      const menuItems: WebElement[] = await driver.findElements(
        By.xpath(
          "//nav//a[contains(text(), 'お問い合わせ') or contains(@href, 'contact')]",
        ),
      );

      if (menuItems.length > 0) {
        // メニューアイテムが見つかった場合
        for (const item of menuItems) {
          // 各アイテムをループ処理
          const text = await item.getText();
          console.log(`メニューが見つかりました: ${text}`); // メニューアイテムを表示

          // クリック可能になるまで待機（要素が表示されていて有効であること）
          await driver.wait(until.elementIsVisible(item), 3000);
          await driver.wait(until.elementIsEnabled(item), 3000);

          try {
            await item.click(); // アイテムをクリック
          } catch (err) {
            if (err instanceof error.ElementClickInterceptedError) {
              // メニューが前面にある場合は閉じるボタンをクリック
              const closeButton: WebElement = await driver.findElement(
                By.className('c-close-icon'),
              );

              if (await closeButton.isDisplayed()) {
                try {
                  // DOMで強制的にクリック
                  await driver.executeScript(
                    'arguments[0].click();',
                    closeButton,
                  );
                  console.log(
                    'メニューを閉じるボタンがDOM経由でクリックされた',
                  );
                } catch (e) {
                  console.log(
                    `DOM経由で閉じるボタンをクリックできませんでした: ${e}`,
                  );
                  return 1;
                }
              } else {
                console.log(
                  '閉じるボタンが表示されない、またはクリックできませんでした',
                );
                return 1;
              }

              // 再度クリックを試行
              console.log(
                `クリックが妨害されました。DOMを使用して強制クリックします: ${text}`,
              );
              await driver.executeScript('arguments[0].click();', item); // DOMを使ってクリック
            } else {
              return 1;
              throw err; // 他のエラーは再スロー
            }
          }
          break; // ループを抜ける
        }
      } else {
        // ページ全体から「お問い合わせ」リンクを検索 (テキスト、href、または img の alt 属性に 'お問い合わせ' を含む)
        const elements: WebElement[] = await driver.findElements(
          By.xpath(
            "//*[contains(text(), 'お問い合わせ') or contains(@href, 'contact') or descendant::img[contains(@alt, 'お問い合わせ')]]",
          ),
        );

        if (elements.length > 0) {
          for (const element of elements) {
            // 各要素をループ処理
            const text = await element.getText();
            console.log(`ページ要素が見つかりました: ${text}`); // 要素を表示

            // クリック可能になるまで待機（要素が表示されていて有効であること）
            await driver.wait(until.elementIsVisible(element), 3000);
            await driver.wait(until.elementIsEnabled(element), 3000);

            try {
              await element.click(); // 要素をクリック
            } catch (err) {
              if (err instanceof error.ElementClickInterceptedError) {
                // メニューが前面にある場合は閉じるボタンをクリック
                const closeButton: WebElement = await driver.findElement(
                  By.className('c-close-icon'),
                );

                if (await closeButton.isDisplayed()) {
                  try {
                    // DOMで強制的にクリック
                    await driver.executeScript(
                      'arguments[0].click();',
                      closeButton,
                    );
                    console.log(
                      'メニューを閉じるボタンがDOM経由でクリックされた',
                    );
                  } catch (e) {
                    console.log(
                      `DOM経由で閉じるボタンをクリックできませんでした: ${e}`,
                    );
                  }
                } else {
                  console.log(
                    '閉じるボタンが表示されない、またはクリックできない',
                  );
                }

                // 再度クリックを試行
                console.log(
                  `クリックが妨害されました。DOMを使用してクリックします: ${text}`,
                );
                await driver.executeScript('arguments[0].click();', element); // DOMを使ってクリック
              } else {
                throw err; // 他のエラーは再スロー
              }
            }
            break; // ループを抜ける
          }
        } else {
          console.log('TOPページ内にお問い合わせフォームはありません');
          return 1;
        }

        // クリック可能な要素を取得し、処理を行う
        const clickableElements: WebElement[] = await this.getClickableElements(
          driver,
        );
        console.log(
          `クリック可能な要素が見つかりました: ${clickableElements.length}`,
        );
        for (const clickable of clickableElements) {
          const tagName = await clickable.getTagName();
          const clickableText = await clickable.getText();
          console.log(
            `クリック可能要素: ${tagName}, テキスト: ${clickableText}`,
          );
        }
      }

      const currentUrl: string = await driver.getCurrentUrl(); // 現在のURLを取得
      console.log('現在のURL: ', currentUrl); // 現在のURLを表示
    } catch (err) {
      if (err instanceof error.TimeoutError) {
        // タイムアウト例外処理
        console.log(
          'お問い合わせリンクがクリックできないか、見つかりません。.',
        );
        return 1;
      } else if (err instanceof error.StaleElementReferenceError) {
        // 古い要素例外処理
        console.log('古くなった要素が検出されたため、スキップします'); // メッセージ表示
        return 1;
      } else {
        console.error(`予期せぬエラーが発生しました: ${err}`); // その他のエラー
        return 1;
      }
    }
  }
  /**
   * クリック可能な要素を取得する関数
   * フッターの中の要素を除外して、aタグ、buttonタグ、onclick属性、またはrole='button'を持つ要素を取得
   * @param driver - Selenium WebDriverのインスタンス
   * @returns クリック可能なWebElementの配列
   */
  async getClickableElements(driver: WebDriver): Promise<WebElement[]> {
    // XPathの説明:
    // - self::a または self::button: aタグまたはbuttonタグ
    // - @onclick: onclick属性を持つ要素
    // - @role='button': role属性が'button'の要素
    // - [not(ancestor::footer)]: 祖先にfooterタグを持たない要素
    const clickableElements: WebElement[] = await driver.findElements(
      By.xpath(
        "//*[self::a or self::button or @onclick or @role='button'][not(ancestor::footer)]",
      ),
    );
    return clickableElements;
  }
  /**
   * 「お問い合わせ」リンクをクリックする関数
   * ヘッダーまたはメニュー内からリンクを探し、クリック可能であればクリックします。
   *
   * @param driver - Selenium WebDriverのインスタンス
   */
  async clickContactLinkIfClickable(driver: WebDriver): Promise<number> {
    try {
      // 現在のURLを取得して表示
      const currentUrl = await driver.getCurrentUrl();
      console.log('クリック前の現在のURL: ', currentUrl);

      let contactLink: WebElement | null = null;

      // ヘッダー内の「お問い合わせ」リンクを探す
      try {
        contactLink = await driver.findElement(
          By.xpath("//header//a[text()='お問い合わせ']"),
        );
      } catch (e) {
        // ヘッダー内に見つからない場合、メニュー内を探す
        try {
          contactLink = await driver.findElement(
            By.xpath("//nav//a[text()='お問い合わせ']"),
          );
        } catch (e) {
          // リンクが見つからない場合はnullを保持
          contactLink = null;
        }
      }

      if (contactLink) {
        try {
          // 要素をスクロールして可視化
          await driver.executeScript(
            'arguments[0].scrollIntoView(true);',
            contactLink,
          );
          // 1秒待機
          await driver.sleep(1000);

          // アクションチェーンを使用して要素をクリック
          const actions = driver.actions({ bridge: true });
          await actions.move({ origin: contactLink }).click().perform();

          // ページの読み込み完了を待機
          await driver.wait(async () => {
            const readyState = await driver.executeScript(
              'return document.readyState',
            );
            return readyState === 'complete';
          }, 3000);
          // 1秒待機
          await driver.sleep(1000);
        } catch (err) {
          if (err instanceof ElementClickInterceptedError) {
            // クリックが他の要素に妨げられた場合
            console.log(
              'クリックが妨害されました。DOMに対して強制クリックを行います',
            );
            await driver.executeScript('arguments[0].click();', contactLink);
          } else if (err instanceof MoveTargetOutOfBoundsError) {
            // 要素が範囲外の場合
            console.log(
              'MoveTargetOutOfBoundsException が発生しました。スクロールと再試行を試みます。',
            );
            await driver.executeScript(
              'arguments[0].scrollIntoView(true);',
              contactLink,
            );
            await driver.executeScript('arguments[0].click();', contactLink);
          } else {
            return 1;
          }
        }
      } else {
        console.log(
          'クリック可能なお問い合わせページはどこにも見つかりませんでした',
        );
        return 1;
      }

      // クリック後のURLを取得して表示
      const newUrl = await driver.getCurrentUrl();
      console.log('Current URL after click (if any): ', newUrl);
    } catch (err) {
      console.error('An error occurred:', err);
      return 1;
    }
  }

  /**
   * ページ内の要素をクリックする統合関数
   *
   * この関数は、クリック可能な要素を検索し、特定の条件に基づいてクリックを試みます。
   * 送信ボタンをテキストやtype属性で特定し、見つからない場合はキーワードに基づいてクリックします。
   *
   * @param driver - Selenium WebDriverのインスタンス
   */
  async clickPageElements(driver: WebDriver): Promise<number> {
    // キーワードのリスト（必要に応じて調整してください）
    const keywordClickList: string[] = ['送信', 'submit', '送信する'];

    try {
      // bodyタグが存在するまで最大20秒待機
      await driver.wait(until.elementLocated(By.tagName('body')), 20000);

      // クリック可能な要素をXPathで取得
      const xpath =
        "//*[(self::a or self::button or self::input) and (@href or @type='button' or @type='submit') and not(@disabled)]";
      const clickableItems: WebElement[] = await driver.findElements(
        By.xpath(xpath),
      );
      console.log(`取得した要素の数: ${clickableItems.length}`);

      let submitButtonFound = false;

      // テキストに基づいて送信ボタンを探してクリック
      for (const elm of clickableItems) {
        const text = (await elm.getText()).trim().toLowerCase();
        if (text === '送信' || text === 'submit' || text === '送信する') {
          console.log(`送信ボタンが見つかりました: "${text}"`);
          submitButtonFound = true;

          const isDisplayed = await elm.isDisplayed();
          const isEnabled = await elm.isEnabled();

          if (isDisplayed && isEnabled) {
            try {
              await driver.executeScript(
                'arguments[0].scrollIntoView(true);',
                elm,
              );
              await driver.wait(until.elementIsClickable(elm), 20000);
              await elm.click();
              break;
            } catch (err) {
              if (err instanceof ElementClickInterceptedError) {
                console.log(
                  'クリックが他の要素に妨げられたため、JavaScriptでクリックを試みます...',
                );
                await driver.executeScript('arguments[0].click();', elm);
                break;
              } else {
                console.error('要素のクリック中にエラーが発生しました:', err);
              }
            }
          } else {
            console.log('要素が表示されていないか無効です。');
            return 1;
          }
        }
      }

      // テキストで送信ボタンが見つからなかった場合、type属性で探す
      if (!submitButtonFound) {
        for (const elm of clickableItems) {
          const type = (await elm.getAttribute('type'))?.toLowerCase();
          if (type === 'submit') {
            console.log(`送信ボタンがtypeで見つかりました: "${type}"`);
            submitButtonFound = true;

            const isDisplayed = await elm.isDisplayed();
            const isEnabled = await elm.isEnabled();

            if (isDisplayed && isEnabled) {
              try {
                await driver.executeScript(
                  'arguments[0].scrollIntoView(true);',
                  elm,
                );
                await driver.wait(until.elementIsClickable(elm), 20000);
                await elm.click();
                break;
              } catch (err) {
                if (err instanceof ElementClickInterceptedError) {
                  console.log(
                    'クリックが他の要素に妨げられたため、JavaScriptでクリックを試みます...',
                  );
                  await driver.executeScript('arguments[0].click();', elm);
                  break;
                } else {
                  console.error('要素のクリック中にエラーが発生しました:', err);
                }
              }
            } else {
              console.log('要素が表示されていないか無効です。');
              return 1;
            }
          }
        }
      }

      // 送信ボタンが見つからなかった場合、キーワードに基づくクリック処理を実行
      if (!submitButtonFound) {
        console.log(
          '送信ボタンが見つかりません。キーワードに基づくクリック処理を実行します。',
        );

        // 取得した要素の詳細を表示
        for (const elm of clickableItems) {
          const tagName = await elm.getTagName();
          const text = await elm.getText();
          const type = await elm.getAttribute('type');
          const id = await elm.getAttribute('id');
          const classes = await elm.getAttribute('class');
          console.log(
            `タグ名: ${tagName}, テキスト: "${text}", type: ${type}, id: ${id}, クラス: ${classes}`,
          );
        }

        // キーワードに基づいて要素をクリック
        for (const elm of clickableItems) {
          const text = (await elm.getText()).toLowerCase();
          const outerHTML = (await elm.getAttribute('outerHTML')).toLowerCase();

          for (const keyword of keywordClickList) {
            const lowerKeyword = keyword.toLowerCase();
            if (
              text.includes(lowerKeyword) ||
              outerHTML.includes(lowerKeyword)
            ) {
              console.log(
                `キーワード "${keyword}" にマッチした要素をクリックします: "${text}"`,
              );
              try {
                await driver.executeScript(
                  'arguments[0].scrollIntoView(true);',
                  elm,
                );
                await driver.wait(until.elementIsVisible(elm), 20000);
                await driver.wait(until.elementIsEnabled(elm), 20000);
                await elm.click();
                return; // クリックしたら関数を終了
              } catch (err) {
                if (err instanceof ElementClickInterceptedError) {
                  console.log(
                    'クリックが他の要素に妨げられたため、JavaScriptでクリックを試みます...',
                  );
                  await driver.executeScript('arguments[0].click();', elm);
                  return; // クリックしたら関数を終了
                } else {
                  console.error('要素のクリック中にエラーが発生しました:', err);
                  return 1;
                }
              }
            }
          }
        }

        console.log(
          'キーワードに基づくクリック対象の要素が見つかりませんでした。',
        );
        return 1;
      }
    } catch (err) {
      console.error('エラーが発生しました:', err);
      return 1;
    } finally {
      // 2秒待機
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  /**
   * /contactページが存在するか確認し、存在する場合はそのページに移動します。
   * 存在しない場合は/inquiryページを確認し、存在する場合はそのページに移動します。
   * 両方とも存在しない場合は元のURLに戻ります。
   *
   * @param driver - Selenium WebDriverのインスタンス
   */
  async clickContactLinkIfContactCheck(driver: WebDriver): Promise<number> {
    // キーワードリスト（エラーメッセージとしてチェックするもの）
    const errorMessages: string[] = [
      '存在しません',
      'ページが見つかりません',
      'Not Found',
      'お探し',
    ];

    try {
      // 現在のURLを取得
      const currentUrl: string = await driver.getCurrentUrl();
      console.log('現在のURL: ', currentUrl);

      // URLを解析
      const parsedUrl = new URL(currentUrl);
      const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
      const contactUrl = `${baseUrl}/contact`;
      const inquiryUrl = `${baseUrl}/inquiry`;

      console.log(`確認するURL: ${contactUrl} または ${inquiryUrl}`);

      /**
       * HTTPステータスコードを確認する関数
       *
       * @param url - チェックするURL
       * @returns ステータスコードが200であればtrue、そうでなければfalse
       */
      async function checkHttpStatus(url: string): Promise<boolean> {
        try {
          const response = await axios.head(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0',
            },
          });
          if (response.status === 200) {
            console.log(
              `ページがアクセス可能です（ステータスコード200）: ${url}`,
            );
            return true;
          } else {
            console.log(
              `非200のステータスコードを受信しました: ${response.status} - ${url}`,
            );
            return false;
          }
        } catch (error: any) {
          if (error.response) {
            // サーバーからのレスポンスがある場合
            console.log(`HTTPエラー: ${error.response.status} - ${url}`);
          } else if (error.request) {
            // リクエストが送信されたが、レスポンスが受け取れなかった場合
            console.log(`レスポンスがありません: ${url}`);
          } else {
            // リクエスト設定中にエラーが発生した場合
            console.log(`エラー: ${error.message}`);
          }
          return false;
        }
      }

      /**
       * ページが存在するかどうかをチェックする関数
       *
       * @param url - チェックするURL
       * @returns ページが存在すればtrue、そうでなければfalse
       */
      async function checkPageExists(url: string): Promise<boolean> {
        if (await checkHttpStatus(url)) {
          try {
            await driver.get(url);
            // ページが完全に読み込まれるまで待機（最大15秒）
            await driver.wait(async () => {
              const readyState = await driver.executeScript(
                'return document.readyState',
              );
              return readyState === 'complete';
            }, 15000);

            const pageSource: string = await driver.getPageSource();

            // エラーメッセージがページソースに含まれていないかチェック
            const hasError = errorMessages.some((errMsg) =>
              pageSource.includes(errMsg),
            );
            if (hasError) {
              throw new Error('ページソースにエラーメッセージが含まれています');
            }

            console.log(`ページが見つかり、ロードされました: ${url}`);
            return true;
          } catch (err: any) {
            if (err instanceof TimeoutError) {
              console.log(`ページの読み込みにタイムアウトしました: ${url}`);
            } else {
              console.log(
                `ページが存在しないか、ロードに失敗しました: ${url} (${err.message})`,
              );
            }
            return false;
          }
        } else {
          return false;
        }
      }

      // /contactページを確認
      const contactExists = await checkPageExists(contactUrl);
      if (contactExists) {
        console.log(`Contactページがロードされました: ${contactUrl}`);
        return;
      }

      // /contactが存在しない場合、/inquiryページを確認
      const inquiryExists = await checkPageExists(inquiryUrl);
      if (inquiryExists) {
        console.log(`Inquiryページがロードされました: ${inquiryUrl}`);
        return;
      }

      // 両方のページが存在しない場合、元のURLに戻る
      console.log('両方のページが存在しないため、元のURLに戻ります。');
      await driver.get(currentUrl);
      return 1;
    } catch (err: any) {
      console.error('エラーが発生しました:', err);
      return 1;
    } finally {
      // 2秒待機
      await driver.sleep(2000);
    }
  }
  /**
   * お問い合わせページで分岐がある場合に処理を行う
   *
   * @param driver - Selenium WebDriverのインスタンス
   */
  async mainpageKeywordClick(driver: WebDriver): Promise<number> {
    // キーワードのリスト（必要に応じて調整してください）
    const contact_click_keywords: string[] = [
      '送信',
      '確認',
      'Submit',
      'Confirm',
    ];

    try {
      // ページの一番下までスクロール
      await driver.executeScript(
        'window.scrollTo(0, document.body.scrollHeight);',
      );

      // ページの読み込みを待機（bodyタグが存在するまで最大20秒）
      await driver.wait(until.elementLocated(By.tagName('body')), 20000);
      console.log('ページのbodyタグが見つかりました。');

      // クリック可能な要素をXPathで取得
      const clickableXPath =
        "//*[(self::a or self::button or self::input) and (@href or @type='button' or @type='submit') and not(@disabled)]";
      const clickableElements: WebElement[] = await driver.findElements(
        By.xpath(clickableXPath),
      );
      console.log(`取得したクリック可能な要素数: ${clickableElements.length}`);

      let submitButtonFound = false;

      // ②テキストに「送信」または「確認」が含まれているボタンがあるかチェック
      for (const el of clickableElements) {
        const text = (await el.getText()).trim();
        const value = (await el.getAttribute('value'))?.trim() || '';
        const combinedText = (text + ' ' + value).toLowerCase();

        if (
          combinedText.includes('送信') ||
          combinedText.includes('確認') ||
          combinedText.includes('submit') ||
          combinedText.includes('confirm')
        ) {
          console.log(`Submitボタンが見つかりました: "${text}"`);
          submitButtonFound = true;

          const isDisplayed = await el.isDisplayed();
          const isEnabled = await el.isEnabled();

          if (isDisplayed && isEnabled) {
            console.log('要素が表示され、かつ有効です。');
            try {
              // 要素をスクロールして表示させる
              await driver.executeScript(
                'arguments[0].scrollIntoView(true);',
                el,
              );
              // 要素がクリック可能になるまで待機
              await driver.wait(until.elementIsClickable(el), 20000);
              await el.click();
              console.log(`"${text}" ボタンをクリックしました。`);
            } catch (err) {
              if (err instanceof ElementClickInterceptedError) {
                console.log(
                  'クリックが妨害されました。DOMに対して強制クリックします。',
                );
                await driver.executeScript('arguments[0].click();', el);
                console.log(
                  `"${text}" ボタンをDOMに対して強制クリックしました。`,
                );
              } else {
                console.error(`要素のクリック中にエラーが発生しました: ${err}`);
              }
            }
            break; // クリックしたらループを抜ける
          } else {
            console.log('要素が表示されていないか無効です。');
          }
        }
      }

      // ④テキストに該当するボタンがない場合、type='submit' を探す
      if (!submitButtonFound) {
        for (const el of clickableElements) {
          const type = (await el.getAttribute('type'))?.toLowerCase() || '';
          if (type === 'submit') {
            console.log(`Submitボタンがtypeで見つかりました: "${type}"`);
            submitButtonFound = true;

            const isDisplayed = await el.isDisplayed();
            const isEnabled = await el.isEnabled();

            if (isDisplayed && isEnabled) {
              console.log('要素が表示され、かつ有効です。');
              try {
                // 要素をスクロールして表示させる
                await driver.executeScript(
                  'arguments[0].scrollIntoView(true);',
                  el,
                );
                // 要素がクリック可能になるまで待機
                await driver.wait(until.elementIsClickable(el), 20000);
                await el.click();
                console.log(`type="submit" のボタンをクリックしました。`);
              } catch (err) {
                if (err instanceof ElementClickInterceptedError) {
                  console.log(
                    'クリックがインターセプトされました。JavaScriptで強制クリックします。',
                  );
                  await driver.executeScript('arguments[0].click();', el);
                  console.log(
                    `type="submit" のボタンをJavaScriptでクリックしました。`,
                  );
                } else {
                  console.error(
                    `要素のクリック中にエラーが発生しました: ${err}`,
                  );
                }
              }
              break; // クリックしたらループを抜ける
            } else {
              console.log('要素が表示されていないか無効です。');
            }
          }
        }
      }

      // submitボタンが見つからなければキーワードに基づくクリック処理を実行
      if (!submitButtonFound) {
        console.log(
          'Submitボタンが見つかりません。キーワードに基づくクリック処理を実行します。',
        );

        // 要素情報を出力
        for (const el of clickableElements) {
          const tagName = await el.getTagName();
          const text = (await el.getText()).trim();
          const type = (await el.getAttribute('type')) || '';
          const id = (await el.getAttribute('id')) || '';
          const classes = (await el.getAttribute('class')) || '';
          console.log(
            `タグ名: ${tagName}, テキスト: "${text}", type: "${type}", id: "${id}", クラス: "${classes}"`,
          );
        }

        // キーワードに合致する要素をクリック
        for (const el of clickableElements) {
          const text = (await el.getText()).toLowerCase();
          const outerHTML = (await el.getAttribute('outerHTML')).toLowerCase();

          for (const keyword of contact_click_keywords) {
            const lowerKeyword = keyword.toLowerCase();
            if (
              text.includes(lowerKeyword) ||
              outerHTML.includes(lowerKeyword)
            ) {
              console.log(
                `キーワード "${keyword}" にマッチした要素をクリックします: "${text}"`,
              );
              try {
                // 要素をスクロールして表示させる
                await driver.executeScript(
                  'arguments[0].scrollIntoView(true);',
                  el,
                );
                // 要素が表示されていて有効になるまで待機
                await driver.wait(until.elementIsVisible(el), 20000);
                await driver.wait(until.elementIsEnabled(el), 20000);
                // クリックを試みる
                await el.click();
                console.log(
                  `キーワード "${keyword}" に基づいてクリックしました。`,
                );
                return; // クリックしたら関数を終了
              } catch (err) {
                if (err instanceof ElementClickInterceptedError) {
                  console.log(
                    'クリックがインターセプトされました。JavaScriptで強制クリックします。',
                  );
                  await driver.executeScript('arguments[0].click();', el);
                  console.log(
                    `キーワード "${keyword}" に基づいてJavaScriptでクリックしました。`,
                  );
                  return; // クリックしたら関数を終了
                } else {
                  console.error(
                    `要素のクリック中にエラーが発生しました: ${err}`,
                  );
                  return 1;
                }
              }
            }
          }
        }

        console.log(
          'キーワードに基づくクリック対象の要素が見つかりませんでした。',
        );
        return 1;
      }
    } catch (err: any) {
      console.error(
        'お問い合わせページで分岐がある処理中にエラーが発生しました:',
        err,
      );
      return 1;
    } finally {
      // 短い遅延を追加（2秒）
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  async handleCheckboxInPage(
    driver: WebDriver,
    keyword: string,
    timeout: number = 10,
  ): Promise<boolean> {
    try {
      // ページ内のli要素を探索し、ラベルにキーワードが含まれているかチェック
      const listItems = await driver.findElements(By.tagName('li'));

      for (const listItem of listItems) {
        // li内のラベルテキストを取得
        const labelText = (await listItem.getText()).trim();

        if (labelText.toLowerCase().includes(keyword.toLowerCase())) {
          try {
            // チェックボックス要素を取得
            const checkbox = await listItem.findElement(By.tagName('input'));

            // チェックボックスが表示されるまでスクロール
            await driver.executeScript(
              'arguments[0].scrollIntoView(true);',
              checkbox,
            );

            // チェックボックスがクリック可能になるまで待機
            await driver.wait(until.elementIsVisible(checkbox), timeout * 1000);
            await driver.wait(until.elementIsEnabled(checkbox), timeout * 1000);

            // チェックボックスが選択されていない場合のみチェックを入れる
            const isSelected = await checkbox.isSelected();
            if (!isSelected) {
              try {
                // 通常のクリックを試行
                await checkbox.click();
              } catch (e) {
                // 通常のクリックが失敗した場合は、JavaScriptで強制的にクリック
                await driver.executeScript('arguments[0].click();', checkbox);
              }

              console.log(`Checkbox with label '${labelText}' selected.`);
            } else {
              console.log(
                `Checkbox with label '${labelText}' is already selected.`,
              );
            }
            return true;
          } catch (e) {
            if (e instanceof error.NoSuchElementError) {
              console.log(
                `Checkbox not found in li element with label: ${labelText}`,
              );
            } else {
              throw e;
            }
          }
        }
      }
      return false;
    } catch (e) {
      if (e instanceof error.TimeoutError) {
        console.log(
          `Checkbox with keyword '${keyword}' was not clickable within ${timeout} seconds.`,
        );
        return false;
      } else {
        throw e;
      }
    }
  }

  /**
   * iframe内外で要素を探索し、キーワードに一致するチェックボックスを操作する関数
   *
   * @param driver - Selenium WebDriverのインスタンス
   * @param checkboxKeywords - チェックボックスと検出するキーワードリスト
   */
  async switchToIframeAndHandleAllCheckboxes(
    driver: WebDriver,
    checkboxKeywords: { [category: string]: string[] },
    timeout: number = 10,
  ): Promise<boolean> {
    try {
      // すべてのiframeを取得
      const iframes = await driver.findElements(By.tagName('iframe'));

      // iframe内に切り替えて処理を行う
      for (let index = 0; index < iframes.length; index++) {
        await driver.switchTo().frame(iframes[index]);
        console.log(`Switched to iframe ${index}`);

        // 各キーワードカテゴリに該当するチェックボックスをチェック
        for (const [category, keywords] of Object.entries(checkboxKeywords)) {
          for (const keyword of keywords) {
            if (await this.handleCheckboxInPage(driver, keyword, timeout)) {
              console.log(
                `Checkbox for keyword '${keyword}' in category '${category}' selected.`,
              );
              break; // 最初に見つかったキーワードで処理を終了
            }
          }
        }
        // メインコンテンツに戻る
        await driver.switchTo().defaultContent();
      }
      // メインコンテンツでチェックボックスを処理
      console.log('Processing checkboxes in the main content...');
      for (const [category, keywords] of Object.entries(checkboxKeywords)) {
        for (const keyword of keywords) {
          if (await this.handleCheckboxInPage(driver, keyword, timeout)) {
            console.log(
              `Checkbox for keyword '${keyword}' in category '${category}' selected.`,
            );
            break; // 最初に見つかったキーワードで処理を終了
          }
        }
      }
      console.log('Checkbox processing completed for all content.');
      return true;
    } catch (e) {
      if (e instanceof error.NoSuchElementError) {
        console.log(`Element not found: ${e}`);
        return false;
      } else {
        throw e;
      }
    }
  }

  // ラジオボタンを操作する関数
  async handleRadioButtonInPage(
    driver: WebDriver,
    keyword: string,
    timeout: number = 10,
  ): Promise<boolean> {
    try {
      // ページ内のli要素を探索し、ラベルにキーワードが含まれているかチェック
      const listItems = await driver.findElements(By.tagName('li'));

      for (const listItem of listItems) {
        // li内のラベルテキストを取得
        const labelText = (await listItem.getText()).trim();

        if (labelText.toLowerCase().includes(keyword.toLowerCase())) {
          try {
            // ラジオボタン要素を取得
            const radioButton = await listItem.findElement(By.tagName('input'));

            // ラジオボタンが表示されるまでスクロール
            await driver.executeScript(
              'arguments[0].scrollIntoView(true);',
              radioButton,
            );

            // ラジオボタンがクリック可能になるまで待機
            await driver.wait(
              until.elementIsEnabled(radioButton),
              timeout * 1000,
            );
            await driver.wait(
              until.elementIsVisible(radioButton),
              timeout * 1000,
            );

            // 親要素全体（<li>要素など）をクリック
            const isSelected = await radioButton.isSelected();
            if (!isSelected) {
              try {
                // 親要素全体をクリックしてラジオボタンを選択
                await listItem.click();
              } catch (e) {
                // 親要素がクリックできない場合は、JavaScriptを使用してラジオボタンをクリック
                await driver.executeScript(
                  'arguments[0].click();',
                  radioButton,
                );
              }

              console.log(`Radio button with label '${labelText}' selected.`);
            } else {
              console.log(
                `Radio button with label '${labelText}' is already selected.`,
              );
            }
            return true;
          } catch (e) {
            if (e instanceof error.NoSuchElementError) {
              console.log(
                `Radio button not found in li element with label: ${labelText}`,
              );
            } else {
              throw e;
            }
          }
        }
      }

      return false;
    } catch (e) {
      if (e instanceof error.TimeoutError) {
        console.log(
          `Radio button with keyword '${keyword}' was not clickable within ${timeout} seconds.`,
        );
        return false;
      } else {
        throw e;
      }
    }
  }

  /**
   * iframe内外で要素を探索し、キーワードに一致するラジオボタンを操作する関数
   *
   * @param driver - Selenium WebDriverのインスタンス
   * @param radioKeywords - ラジオボタンと検出するキーワードリスト
   */
  async switchToIframeAndHandleAllRadioButtons(
    driver: WebDriver,
    radioKeywords: { [category: string]: string[] },
    timeout: number = 10,
  ): Promise<boolean> {
    try {
      // すべてのiframeを取得
      const iframes = await driver.findElements(By.tagName('iframe'));

      // iframe内に切り替えて処理を行う
      for (let index = 0; index < iframes.length; index++) {
        await driver.switchTo().frame(iframes[index]);
        console.log(`Switched to iframe ${index}`);

        // 各キーワードカテゴリに該当するラジオボタンを選択
        for (const [category, keywords] of Object.entries(radioKeywords)) {
          for (const keyword of keywords) {
            if (await this.handleRadioButtonInPage(driver, keyword, timeout)) {
              console.log(
                `Radio button for keyword '${keyword}' in category '${category}' selected.`,
              );
              break; // 最初に見つかったキーワードで処理を終了
            }
          }
        }
        // メインコンテンツに戻る
        await driver.switchTo().defaultContent();
      }

      // メインコンテンツでラジオボタンを処理
      console.log('Processing radio buttons in the main content...');
      for (const [category, keywords] of Object.entries(radioKeywords)) {
        for (const keyword of keywords) {
          if (await this.handleRadioButtonInPage(driver, keyword, timeout)) {
            console.log(
              `Radio button for keyword '${keyword}' in category '${category}' selected.`,
            );
            break; // 最初に見つかったキーワードで処理を終了
          }
        }
      }

      console.log('Radio button processing completed for all content.');
      return true;
    } catch (e) {
      if (e instanceof error.NoSuchElementError) {
        console.log(`Element not found: ${e}`);
        return false;
      } else {
        throw e;
      }
    }
  }

  /**
   * チェックボックス要素を処理し、特定のキーワードに該当するもののみ選択する関数
   *
   * @param driver - Selenium WebDriverのインスタンス
   * @param extractedData - 抽出された要素データを格納するリスト
   * @param checkboxKeywords - チェックボックスと検出するキーワードリスト
   */
  async handleCheckboxElements(
    driver: WebDriver,
    extractedData: ExtractedData[],
    checkboxKeywords: { [category: string]: string[] },
  ): Promise<void> {
    // ページ内のすべての<tr>要素を取得
    const trElements = await driver.findElements(By.xpath('//tr'));

    for (const tr of trElements) {
      const checkboxElements = await tr.findElements(
        By.xpath('.//input[@type="checkbox"]'),
      );
      const matchedCheckboxes: WebElement[] = [];

      for (const checkboxElement of checkboxElements) {
        try {
          const checkboxName = await checkboxElement.getAttribute('name');
          const checkboxValue = await checkboxElement.getAttribute('value');
          let selectedOption: string | null = null;

          // 定義されたキーワードリストに基づいて、適切なチェックボックスを選択
          for (const [category, keywords] of Object.entries(checkboxKeywords)) {
            for (const keyword of keywords) {
              if (
                (checkboxValue && checkboxValue.includes(keyword)) ||
                (checkboxName && checkboxName.includes(keyword))
              ) {
                matchedCheckboxes.push(checkboxElement);
                selectedOption = checkboxValue;

                extractedData.push({
                  id: null,
                  element_name: checkboxName,

                  element_value: null,
                  element_text: selectedOption,
                  parent_text: (await tr.getText()).trim(),
                  siblings_text: '',
                  class_name: await checkboxElement.getAttribute('class'),
                  label_text: '',
                  element_type: 'checkbox',
                  tr_text: (await tr.getText()).trim(),
                  category: category,
                });
                break;
              }
            }
            if (selectedOption) {
              break;
            }
          }

          if (!selectedOption) {
            console.log(
              `No matching option found for checkbox with name/id: ${checkboxName} in TR.`,
            );
          }
        } catch (e) {
          console.log(`Failed to select checkbox in TR: ${e}`);
        }
      }

      // マッチしたチェックボックスに対してチェックを入れる
      for (const checkbox of matchedCheckboxes) {
        try {
          // 要素が表示されるようにスクロール
          await driver.executeScript(
            'arguments[0].scrollIntoView();',
            checkbox,
          );

          // 要素がクリック可能になるまで待機
          await driver.wait(until.elementIsEnabled(checkbox), 3000);

          // チェックボックスをクリック (JavaScriptを使用)
          await driver.executeScript('arguments[0].click();', checkbox);
          console.log(
            `Checkbox selected using JavaScript: ${await checkbox.getAttribute(
              'name',
            )}`,
          );
        } catch (e) {
          console.log(`Failed to click checkbox: ${e}`);
        }
      }
    }

    // ページ内のすべてのチェックボックス要素を取得
    const allCheckboxElements = await driver.findElements(
      By.xpath("//input[@type='checkbox']"),
    );

    // 各チェックボックス要素に対して操作を行う
    for (const checkboxElement of allCheckboxElements) {
      try {
        const checkboxName = await checkboxElement.getAttribute('name');
        const checkboxValue = await checkboxElement.getAttribute('value');
        let selectedOption: string | null = null;

        // 定義されたキーワードリストに基づいて、適切なチェックボックスを選択
        for (const [category, keywords] of Object.entries(checkboxKeywords)) {
          for (const keyword of keywords) {
            if (
              (checkboxValue && checkboxValue.includes(keyword)) ||
              (checkboxName && checkboxName.includes(keyword))
            ) {
              const isSelected = await checkboxElement.isSelected();
              if (!isSelected) {
                await checkboxElement.click();
                selectedOption = checkboxValue;
                console.log(
                  `${category} checkbox selection successful with option '${selectedOption}'.`,
                );
              }

              // 抽出データに追加
              const parentElement = await checkboxElement.findElement(
                By.xpath('..'),
              );
              const trElement = await checkboxElement
                .findElement(By.xpath('ancestor::tr'))
                .catch(() => null);

              extractedData.push({
                id: null,
                element_name: checkboxName,

                element_value: null,
                element_text: selectedOption,
                parent_text: (await parentElement.getText()).trim(),
                siblings_text: '',
                class_name: await checkboxElement.getAttribute('class'),
                label_text: '',
                element_type: 'checkbox',
                tr_text: trElement ? (await trElement.getText()).trim() : '',
                category: category,
              });
              break;
            }
          }
          if (selectedOption) {
            break;
          }
        }

        if (!selectedOption) {
          console.log(
            `No matching option found for checkbox with name/id: ${checkboxName}`,
          );
        }
      } catch (e) {
        console.log(`Failed to select checkbox: ${e}`);
      }
    }
  }

  /**
   * ラジオボタン要素を処理し、特定のキーワードに該当するもののみ選択する関数
   *
   * @param driver - Selenium WebDriverのインスタンス
   * @param extractedData - 抽出された要素データを格納するリスト
   * @param radioKeywords - ラジオボタンと検出するキーワードリスト
   */
  async handleRadioElements(
    driver: WebDriver,
    extractedData: ExtractedData[],
    radioKeywords: { [category: string]: string[] },
  ): Promise<void> {
    // ページ内のすべての<tr>要素を取得
    const trElements = await driver.findElements(By.xpath('//tr'));

    for (const tr of trElements) {
      const radioElements = await tr.findElements(
        By.xpath('.//input[@type="radio"]'),
      );
      const matchedRadios: WebElement[] = [];

      for (const radioElement of radioElements) {
        try {
          const radioName = await radioElement.getAttribute('name');
          const radioValue = await radioElement.getAttribute('value');
          let selectedOption: string | null = null;

          for (const [category, keywords] of Object.entries(radioKeywords)) {
            for (const keyword of keywords) {
              if (
                (radioValue && radioValue.includes(keyword)) ||
                (radioName && radioName.includes(keyword))
              ) {
                matchedRadios.push(radioElement);
                selectedOption = radioValue;

                extractedData.push({
                  id: null,
                  element_name: radioName,

                  element_value: null,
                  element_text: selectedOption,
                  parent_text: (await tr.getText()).trim(),
                  siblings_text: '',
                  class_name: await radioElement.getAttribute('class'),
                  label_text: '',
                  element_type: 'radio',
                  tr_text: (await tr.getText()).trim(),
                  category: category,
                });
                break;
              }
            }
            if (selectedOption) {
              break;
            }
          }

          if (!selectedOption) {
            console.log(
              `No matching option found for radio with name/id: ${radioName} in TR.`,
            );
          }
        } catch (e) {
          console.log(`Failed to select radio in TR: ${e}`);
        }
      }

      // マッチしたラジオボタンに対して選択を行う
      for (const radio of matchedRadios) {
        try {
          // 要素が表示されるようにスクロール
          await driver.executeScript('arguments[0].scrollIntoView();', radio);

          // 要素がクリック可能になるまで待機
          await driver.wait(until.elementIsEnabled(radio), 3000);

          // ラジオボタンをクリック (JavaScriptを使用)
          await driver.executeScript('arguments[0].click();', radio);
          console.log(
            `Radio selected using JavaScript: ${await radio.getAttribute(
              'name',
            )}`,
          );
        } catch (e) {
          console.log(`Failed to click radio: ${e}`);
        }
      }
    }

    // ページ内のすべてのラジオボタン要素を取得
    const allRadioElements = await driver.findElements(
      By.xpath("//input[@type='radio']"),
    );

    // 各ラジオボタン要素に対して操作を行う
    for (const radioElement of allRadioElements) {
      try {
        const radioName = await radioElement.getAttribute('name');
        const radioValue = await radioElement.getAttribute('value');
        let selectedOption: string | null = null;

        for (const [category, keywords] of Object.entries(radioKeywords)) {
          for (const keyword of keywords) {
            if (
              (radioValue && radioValue.includes(keyword)) ||
              (radioName && radioName.includes(keyword))
            ) {
              const isSelected = await radioElement.isSelected();
              if (!isSelected) {
                await radioElement.click();
                selectedOption = radioValue;
                console.log(
                  `${category} radio selection successful with option '${selectedOption}'.`,
                );
              }

              // 抽出データに追加
              const parentElement = await radioElement.findElement(
                By.xpath('..'),
              );
              const parentText = (await parentElement.getText()).trim();
              const trElement = await radioElement
                .findElement(By.xpath('ancestor::tr'))
                .catch(() => null);
              const trText = trElement
                ? (await trElement.getText()).trim()
                : '';

              extractedData.push({
                id: null,
                element_name: radioName,
                element_value: null,
                element_text: selectedOption,
                parent_text: parentText,
                siblings_text: '',
                class_name: await radioElement.getAttribute('class'),
                label_text: '',
                element_type: 'radio',
                tr_text: trText,
                category: category,
              });
              break;
            }
          }
          if (selectedOption) {
            break;
          }
        }

        if (!selectedOption) {
          console.log(
            `No matching option found for radio with name/id: ${radioName}`,
          );
        }
      } catch (e) {
        console.log(`Failed to select radio: ${e}`);
      }
    }
  }

  /**
   * ページ内、またはiframe内のすべてのセレクトボックスをキーワードに基づいて操作
   *
   * @param driver - Selenium WebDriverのインスタンス
   * @param extractedData - 抽出された要素データを格納するリスト
   * @param selectboxKeywords - セレクトボックスと検出するキーワードリスト
   */
  async processSelectElementsWithIframes(
    driver: WebDriver,
    extractedData: ExtractedData[],
    selectboxKeywords: { [category: string]: string[] },
  ): Promise<void> {
    // メインページのセレクトボックスを処理
    console.log('Processing select elements in main content...');
    await this.handleSelectElements(driver, extractedData, selectboxKeywords);

    // iframe内のセレクトボックスを処理
    const iframes = await driver.findElements(By.tagName('iframe'));
    for (let index = 0; index < iframes.length; index++) {
      try {
        await driver.switchTo().frame(iframes[index]); // iframeに切り替え
        console.log(`Switched to iframe ${index}`);
        await this.handleSelectElements(
          driver,
          extractedData,
          selectboxKeywords,
        );
        await driver.switchTo().defaultContent(); // メインコンテンツに戻る
      } catch (e) {
        console.log(
          `Failed to process select elements in iframe ${index}: ${e}`,
        );
        await driver.switchTo().defaultContent(); // iframeからメインコンテンツに戻る
      }
    }
  }

  /**
   * セレクトボックスを処理し、適切なオプションを選択する関数
   *
   * @param driver - Selenium WebDriverのインスタンス
   * @param extractedData - 抽出された要素データを格納するリスト
   */
  async handleSelectElements(
    driver: WebDriver,
    extractedData: ExtractedData[],
    checkboxKeywords: { [category: string]: string[] },
  ): Promise<void> {
    // ページ内のすべてのセレクトボックス要素を取得
    let selectElements = await driver.findElements(By.xpath('//select'));

    // 各セレクトボックス要素に対して操作を行う
    for (const selectElement of selectElements) {
      try {
        let selectedOption: string | null = null;

        // 定義されたキーワードリストに基づいて、最適なオプションを選択
        for (const [category, keywords] of Object.entries(checkboxKeywords)) {
          for (const keyword of keywords) {
            const options = await selectElement.findElements(
              By.tagName('option'),
            );
            for (const option of options) {
              const optionText = await option.getText();
              if (optionText.includes(keyword)) {
                // オプションを選択
                await option.click();
                selectedOption = optionText;
                console.log(
                  `${category} select successful with option '${selectedOption}'.`,
                );
                break;
              }
            }
            if (selectedOption) {
              break; // 最初にマッチしたオプションを選択したら、そのカテゴリのループを抜ける
            }
          }
          if (selectedOption) {
            // 抽出データに追加
            const elementName =
              (await selectElement.getAttribute('name')) ||
              (await selectElement.getAttribute('id'));
            const parentElement = await selectElement.findElement(
              By.xpath('..'),
            );
            const parentText = (await parentElement.getText()).trim();
            const className = await selectElement.getAttribute('class');
            const trElement = await selectElement
              .findElement(By.xpath('ancestor::tr'))
              .catch(() => null);
            const trText = trElement ? (await trElement.getText()).trim() : '';

            extractedData.push({
              id: null,
              element_name: elementName,
              element_value: null,
              element_text: selectedOption,
              parent_text: parentText,
              siblings_text: '', // 必要に応じて追加
              class_name: className,
              label_text: '', // 必要に応じて追加
              element_type: 'select',
              tr_text: trText,
              category: category,
            });
            break;
          }
        }

        if (!selectedOption) {
          const elementName =
            (await selectElement.getAttribute('name')) ||
            (await selectElement.getAttribute('id'));
          console.log(
            `No matching option found for select element with name/id: ${elementName}`,
          );
        }
      } catch (e) {
        console.log(`Failed to select options: ${e}`);
      }
    }

    // ページ内のすべてのセレクトボックス要素を再度取得して処理
    try {
      selectElements = await driver.findElements(By.xpath('//select'));
      for (const selectElement of selectElements) {
        try {
          let selectedOption: string | null = null;

          // 定義されたキーワードリストに基づいて、最適なオプションを選択
          for (const [category, keywords] of Object.entries(checkboxKeywords)) {
            for (const keyword of keywords) {
              const options = await selectElement.findElements(
                By.tagName('option'),
              );
              for (const option of options) {
                const optionText = await option.getText();
                if (optionText.includes(keyword)) {
                  // オプションを選択
                  await option.click();
                  selectedOption = optionText;
                  console.log(
                    `${category} select successful with option '${selectedOption}'.`,
                  );
                  break;
                }
              }
              if (selectedOption) {
                break; // 最初にマッチしたオプションを選択したら、そのカテゴリのループを抜ける
              }
            }
            if (selectedOption) {
              // 抽出データに追加
              const elementName =
                (await selectElement.getAttribute('name')) ||
                (await selectElement.getAttribute('id'));
              const parentElement = await selectElement.findElement(
                By.xpath('..'),
              );
              const parentText = (await parentElement.getText()).trim();
              const className = await selectElement.getAttribute('class');
              const trElement = await selectElement
                .findElement(By.xpath('ancestor::tr'))
                .catch(() => null);
              const trText = trElement
                ? (await trElement.getText()).trim()
                : '';

              extractedData.push({
                id: null,
                element_name: elementName,
                element_value: null,
                element_text: selectedOption,
                parent_text: parentText,
                siblings_text: '', // 必要に応じて追加
                class_name: className,
                label_text: '', // 必要に応じて追加
                element_type: 'select',
                tr_text: trText,
                category: category,
              });
              break;
            }
          }

          if (!selectedOption) {
            const elementName =
              (await selectElement.getAttribute('name')) ||
              (await selectElement.getAttribute('id'));
            console.log(
              `No matching option found for select element with name/id: ${elementName}`,
            );
          }
        } catch (e) {
          console.log(`Failed to select options: ${e}`);
        }
      }
    } catch (e) {
      if (e instanceof error.NoSuchElementError) {
        console.log('No select elements found on the page.');
      } else {
        console.log(`Error: ${e}`);
      }
    }
  }

  /**
   * ドライバーを渡して、同意しますのチェックボックスを操作
   *
   * @param driver - Selenium WebDriverのインスタンス
   */
  async handleAgreementCheckbox(
    driver: WebDriver,
    keywords: string[] = null,
    timeout: number = 10,
  ): Promise<boolean> {
    try {
      // デフォルトのキーワードリストを定義
      if (!keywords || keywords.length === 0) {
        keywords = [
          '同意',
          '確認',
          '間違い',
          '承認',
          'プライバシー',
          '承知',
          'メルマガ',
          'agree',
          'policy',
          'opt',
          'privacy',
          'accept',
          '内容',
        ];
      }

      // ページ内のすべてのチェックボックス要素を取得
      const checkboxes = await driver.findElements(
        By.xpath("//input[@type='checkbox']"),
      );

      for (const checkbox of checkboxes) {
        // チェックボックスの親要素（labelなど）を取得
        const parentLabel = await checkbox.findElement(By.xpath('..'));

        // 親要素が空の場合、兄弟要素や祖先要素からテキストを取得
        let parentText = (await parentLabel.getText()).trim();

        if (!parentText) {
          try {
            // 兄弟要素にテキストがあるか確認
            const sibling = await checkbox.findElement(
              By.xpath('following-sibling::*'),
            );
            parentText = (await sibling.getText()).trim();
          } catch {
            // 何もしない
          }
        }

        // キーワードに一致する場合、チェックボックスにチェックを入れる
        if (keywords.some((keyword) => parentText.includes(keyword))) {
          // チェックボックスが表示され、クリック可能になるまで待機
          await driver.executeScript(
            'arguments[0].scrollIntoView(true);',
            checkbox,
          );
          await driver.wait(until.elementIsVisible(checkbox), timeout * 1000);
          await driver.wait(until.elementIsEnabled(checkbox), timeout * 1000);

          // チェックが入っていない場合のみ、親要素または直接チェックボックスをクリック
          const isSelected = await checkbox.isSelected();
          if (!isSelected) {
            try {
              await parentLabel.click(); // 親要素をクリック
              console.log(
                `親要素をクリックして、'${parentText}' のチェックボックスにチェックを入れました。`,
              );
            } catch (e) {
              console.log(
                `親要素のクリックに失敗しました: ${e}. 直接チェックボックスをクリックします。`,
              );
              try {
                await checkbox.click(); // 直接クリック
                console.log(
                  `直接チェックボックスをクリックして、'${parentText}' にチェックを入れました。`,
                );
              } catch (e) {
                console.log(
                  `直接のクリックに失敗しました: ${e}. JavaScriptを使用してクリックします。`,
                );
                // JavaScriptで強制的にチェックボックスをクリック
                await driver.executeScript('arguments[0].click();', checkbox);
                console.log(
                  `JavaScriptで'${parentText}' のチェックボックスにチェックを入れました。`,
                );
              }
            }
          } else {
            console.log(
              `'${parentText}' のチェックボックスは既にチェックされています。`,
            );
          }
          return true; // チェックが完了したら処理を終了
        }
      }

      console.log('該当するチェックボックスが見つかりませんでした。');
      return false;
    } catch (e) {
      console.log(`チェックボックスの操作に失敗しました: ${e}`);
      return false;
    }
  }

  /**
   * ラジオボタンを処理し、適切なオプションを選択する関数
   *
   * @param driver - Selenium WebDriverのインスタンス
   * @param extractedData - 抽出された要素データを格納するリスト
   * @param radioKeywords - ラジオボタンと検出するキーワードリスト
   */
  async handleRadioButtons(
    driver: WebDriver,
    extractedData: ExtractedData[],
    radioKeywords: { [category: string]: string[] },
  ): Promise<void> {
    // ページ内のすべてのラジオボタン要素を取得
    const radioElements = await driver.findElements(
      By.xpath("//input[@type='radio']"),
    );

    // 各ラジオボタン要素に対して操作を行う
    for (const radioElement of radioElements) {
      try {
        const radioName = await radioElement.getAttribute('name'); // ラジオボタンの名前を取得
        let selectedOption: string | null = null; // 選択されたオプションを保持する変数

        // 定義されたキーワードリストに基づいて、最適なオプションを選択
        for (const [category, keywords] of Object.entries(radioKeywords)) {
          for (const keyword of keywords) {
            const radioValue = await radioElement.getAttribute('value');
            if (radioValue && radioValue.includes(keyword)) {
              await radioElement.click();
              selectedOption = radioValue;
              console.log(
                `${category} radio selection successful with option '${selectedOption}'.`,
              );
              break;
            }
          }
          if (selectedOption) {
            // 抽出データに追加
            const parentElement = await radioElement.findElement(
              By.xpath('..'),
            );
            const parentText = (await parentElement.getText()).trim();

            let trText = '';
            try {
              const trElement = await radioElement.findElement(
                By.xpath('ancestor::tr'),
              );
              trText = (await trElement.getText()).trim();
            } catch {
              trText = '';
            }

            extractedData.push({
              id: null,
              element_name: radioName,

              element_value: null,
              element_text: selectedOption,
              parent_text: parentText,
              siblings_text: '', // 必要に応じて追加
              class_name: await radioElement.getAttribute('class'),
              label_text: '', // 必要に応じて追加
              element_type: 'radio',
              tr_text: trText,
              category: category, // カテゴリを追加
            });
            break;
          }
        }

        if (!selectedOption) {
          // 選択されたオプションがない場合
          console.log(
            `No matching option found for radio button with name: ${radioName}`,
          );
        }
      } catch (e) {
        // エラーが発生した場合の処理
        console.log(`Failed to select radio button: ${e}`); // エラーメッセージを表示
      }
    }
  }

  /**
   * データをカテゴリに分類する関数
   *
   * @param extractedData - 抽出された要素データを格納するリスト
   */
  async categorizeData(extractedData: ExtractedData[]): Promise<Categories> {
    interface DataItem {
      element_name?: string;
      label_text?: string;
      siblings_text?: string;
      tr_text?: string;
      parent_text?: string;
      element_text?: string;
      [key: string]: any;
    }
    let categories: Categories = {
      id: null,
      departments: [],
      positions: [],
      email_addresses: [],
      phone_numbers: [],
      fax_numbers: [],
      mobile_numbers: [],
      company_names: [],
      employee_sizes: [],
      inquiry_contents: [],
      inquiry_genre: [],
      address: [],
      address_zip: [],
      address_prefecture: [],
      address_city: [],
      address_street: [],
      post_code: [],
      url: [],
      industry: [],
      how_found: [],
      introduction_time: [],
      name: [],
      kana: [],
      hiragana: [],
      hiragana_sei: [],
      hiragana_mei: [],
      hiragana_fullname: [],
      katakana: [],
      katakana_sei: [],
      katakana_mei: [],
      katakana_fullname: [],
      kanji: [],
      kanji_sei: [],
      kanji_mei: [],
      kanji_fullname: [],
    };

    let address_zip_keywords = [
      '郵便番号',
      'post_code',
      'post code',
      'post-code',
      '〒',
      'zip',
      'ZIP',
    ];
    let address_prefecture_keywords = [
      '都道府県',
      '県',
      'prefecture',
      'pref',
      'stat',
    ];
    let address_city_keywords = ['市', '町', '村', '区', 'city', 'City'];
    let address_street_keywords = [
      '番地',
      '住所',
      'address',
      '所在',
      'それ以降',
      'addr',
      '地',
      '勤務地',
      'ADDR',
      '建物',
      'ビル',
      'build',
    ];
    let introduction_time_keywords = [
      '導入',
      '時期',
      '検討',
      'dounyu',
      'time',
      'introduction',
      'when',
      'desired',
      'period',
    ];
    let name_keywords = [
      'last_name',
      '姓',
      '苗字',
      'ラストネーム',
      'last',
      'sei',
      'first_name',
      '名前',
      '名',
      'ファースト',
      'first',
      'mei',
      '氏名',
      'namae',
      'full_name',
      'name',
      '名前',
      '氏名',
      '担当者名',
      '名',
      'お名前',
      'name',
      'フルネーム',
      'かな',
      'ふり',
      'カナ',
      'フリ',
      'ruby',
      'ガナ',
      'kana',
      'furi',
      'kana',
    ];
    let hiragana_keywords = ['かな', 'ふり'];
    let hiragana_sei_keywords = [
      'last_name',
      '姓',
      '苗字',
      'ラストネーム',
      'last',
      'sei',
    ];
    let katakana_sei_keywords = [
      'last_name',
      '姓',
      '苗字',
      'ラストネーム',
      'last',
      'sei',
      'セイ',
    ];
    let kanji_sei_keywords = [
      'last_name',
      '姓',
      '苗字',
      'ラストネーム',
      'last',
      'sei',
    ];
    let email_keywords = ['email', 'メール', 'mail', 'メールアドレス'].filter(
      (keyword) => keyword !== 'mailform',
    );
    let phone_keywords = ['phone', '電話', 'tel', '電話番号', '貴社電話番号'];
    let fax_keywords = ['fax', 'FAX'];
    let post_code_keywords = [
      '郵便番号',
      'post_code',
      'post code',
      'post-code',
      '〒',
      'zip',
      'ZIP',
    ];
    let company_keywords = [
      'company',
      '会社',
      'corp',
      '会社名',
      '法人',
      '法人名',
      '貴社',
      '組織',
      '団体名',
      '団体',
      'c-name',
      'c_name',
      'c name',
    ];
    let departments_keywords = [
      'department',
      '部署',
      '事業部',
      '部',
      'busyo',
      'jigyoubu',
      '職種',
      'syokushu',
      '所属',
      'shozoku',
      'syozoku',
      'division',
      'job_category',
      'belongs',
      'your_job',
      'your-job',
      'job',
    ];
    let employee_sizes_keywords = [
      'employee_sizes',
      'employee',
      '従業員',
      '規模',
    ];
    let positions_keywords = [
      'position',
      'ポジション',
      '役職',
      'yakushoku',
      'yakusyoku',
      '役職名',
      'jobtitle',
      'post',
    ];
    let inquiry_genre_keywords = [
      '問い合わせ',
      '問合',
      '相談',
      '意見',
      'toiawase',
      'iken',
      'soudan',
      'detail',
      '内容',
      'descript',
      'メッセージ',
      'message',
      '本文',
      'inquiry',
      '件名',
      '題名',
      'title',
      'タイトル',
      'subject',
    ];
    let address_keywords = [
      '県',
      '地域',
      'prefecture',
      '勤務地',
      '地',
      '住所',
      'address',
      'ADDR',
    ];
    let url_keywords = [
      'url',
      'URL',
      'HP',
      'ホームページ',
      'ページ',
      'サイト',
      'website',
      'site',
      'リンク',
      'link',
    ];
    let industry_keywords = [
      '業種',
      'industry',
      'Industry',
      'gyousyu',
      'gyoushu',
      '業界',
      'gyoukai',
      'gyokai',
    ];
    let how_found_keywords = ['知', 'きっかけ', '経路', 'kikkake'];

    for (const item of extractedData) {
      const element_name = (item.element_name || '').toLowerCase();
      const text = (item.element_text || '').trim();
      const label_text = (item.label_text || '').toLowerCase().trim();
      const siblings_text = (item.siblings_text || '').toLowerCase().trim();
      const tr_text = (item.tr_text || '').toLowerCase().trim();
      const parent_text = (item.parent_text || '').toLowerCase().trim();
      const element_text = (item.element_text || '').toLowerCase().trim();

      // ラベルと要素名を組み合わせてカテゴリを判定する
      let combined_search_text0 = `${element_name} ${label_text} ${siblings_text} ${tr_text}`;
      let combined_search_text = `${element_name} ${label_text}${tr_text}`;
      let combined_search_text2 = `${element_name} ${label_text} ${parent_text} ${tr_text}`;
      let combined_search_text3 = `${element_name} ${tr_text}`;
      let combined_text = `${element_name} ${element_text} ${label_text}${text} `;
      let d_combined_text = `${element_name} ${element_text}`;
      let combined_search_text4 = `${element_name} ${label_text} ${siblings_text} ${tr_text} ${parent_text} ${element_text}`;

      // 'mailform' が含まれている場合は削除する
      const textsToClean = [
        { key: 'combined_search_text0', value: combined_search_text0 },
        { key: 'combined_search_text', value: combined_search_text },
        { key: 'combined_search_text2', value: combined_search_text2 },
        { key: 'combined_search_text3', value: combined_search_text3 },
        { key: 'combined_text', value: combined_text },
        { key: 'd_combined_text', value: d_combined_text },
      ];

      textsToClean.forEach((textObj) => {
        if (textObj.value.includes('mailform')) {
          textObj.value = textObj.value.replace(/mailform/g, '');
        }
        switch (textObj.key) {
          case 'combined_search_text0':
            combined_search_text0 = textObj.value;
            break;
          case 'combined_search_text':
            combined_search_text = textObj.value;
            break;
          case 'combined_search_text2':
            combined_search_text2 = textObj.value;
            break;
          case 'combined_search_text3':
            combined_search_text3 = textObj.value;
            break;
          case 'combined_text':
            combined_text = textObj.value;
            break;
          case 'd_combined_text':
            d_combined_text = textObj.value;
            break;
        }
      });

      // 住所に関するキーワードを確認して一旦addressカテゴリに集める
      const addressKeywords = [
        ...address_zip_keywords,
        ...address_prefecture_keywords,
        ...address_city_keywords,
        ...address_street_keywords,
      ];

      if (addressKeywords.some((keyword) => combined_text.includes(keyword))) {
        categories['address'].push(item);
        continue;
      }

      // jobtitleの確認
      if (
        ['jobtitle', 'job_title', 'job-title'].some((keyword) =>
          combined_search_text.includes(keyword),
        )
      ) {
        if (!categories['positions'] || categories['positions'].length === 0) {
          categories['positions'].push(item);
        }
        continue; // positionsに追加後、他のカテゴリのチェックをスキップ
      }

      // company_namesカテゴリ判定時に「メール」と「住所」の両方が含まれていないかどうかもチェック
      if (
        company_keywords.some((keyword) =>
          combined_search_text2.includes(keyword),
        )
      ) {
        // 'メール' または '住所' のいずれかが含まれていないことを確認
        const excludeKeywords = [
          ...email_keywords,
          ...address_keywords,
          ...phone_keywords,
        ];
        if (
          !excludeKeywords.some((keyword) =>
            combined_search_text.includes(keyword),
          )
        ) {
          categories['company_names'].push(item);
          continue;
        }
      }

      // カテゴリ分岐時にテキストエリアをinquiryContentsに分類
      if (item.element_type === 'Textarea') {
        categories['inquiry_contents'].push(item);
      }

      // カテゴリ判定
      if (
        email_keywords.some((keyword) =>
          combined_search_text0.includes(keyword),
        )
      ) {
        categories['email_addresses'].push(item);
        continue;
      }
      if (
        phone_keywords.some((keyword) =>
          combined_search_text0.includes(keyword),
        )
      ) {
        categories['phone_numbers'].push(item);
        continue;
      }
      if (
        post_code_keywords.some((keyword) =>
          combined_search_text0.includes(keyword),
        )
      ) {
        categories['post_code'].push(item);
        continue;
      }
      if (
        fax_keywords.some((keyword) => combined_search_text0.includes(keyword))
      ) {
        categories['fax_numbers'].push(item);
        continue;
      }
      if (
        positions_keywords.some((keyword) =>
          combined_search_text0.includes(keyword),
        )
      ) {
        categories['positions'].push(item);
        continue;
      }
      if (
        departments_keywords.some((keyword) =>
          combined_search_text0.includes(keyword),
        )
      ) {
        categories['departments'].push(item);
        continue;
      }
      if (
        introduction_time_keywords.some((keyword) =>
          combined_search_text0.includes(keyword),
        )
      ) {
        categories['introduction_time'].push(item);
        continue;
      }
      if (
        employee_sizes_keywords.some((keyword) =>
          combined_search_text0.includes(keyword),
        )
      ) {
        categories['employee_sizes'].push(item);
        continue;
      }
      if (
        inquiry_genre_keywords.some((keyword) =>
          combined_search_text.includes(keyword),
        )
      ) {
        categories['inquiry_genre'].push(item);
        continue;
      }
      if (
        inquiry_genre_keywords.some((keyword) =>
          combined_search_text0.includes(keyword),
        )
      ) {
        categories['inquiry_genre'].push(item);
        continue;
      }
      if (
        address_keywords.some((keyword) =>
          combined_search_text0.includes(keyword),
        )
      ) {
        categories['address'].push(item);
        continue;
      }
      if (
        url_keywords.some((keyword) => combined_search_text0.includes(keyword))
      ) {
        categories['url'].push(item);
        continue;
      }
      if (
        industry_keywords.some((keyword) =>
          combined_search_text0.includes(keyword),
        )
      ) {
        categories['industry'].push(item);
        continue;
      }
      if (
        how_found_keywords.some((keyword) =>
          combined_search_text0.includes(keyword),
        )
      ) {
        categories['how_found'].push(item);
        continue;
      }

      // ここでnameカテゴリに入れるかを判定
      const combinedKeywords = [
        ...departments_keywords,
        ...positions_keywords,
        ...company_keywords,
        ...employee_sizes_keywords,
        ...inquiry_genre_keywords,
        ...how_found_keywords,
        ...address_keywords,
        ...address_street_keywords,
      ];

      if (
        combinedKeywords.some((keyword) =>
          combined_search_text4.includes(keyword),
        )
      ) {
        continue; // これらのキーワードが含まれている場合はnameに追加しない
      }

      // nameカテゴリに追加
      if (
        name_keywords.some((keyword) => combined_search_text4.includes(keyword))
      ) {
        categories['name'].push(item);
      }
    }
    // nameに分類された要素を再分類
    for (const item of categories['name']) {
      const element_name = (item.element_name || '').toLowerCase();
      const label_text = (item.label_text || '').toLowerCase().trim();
      const siblings_text = (item.siblings_text || '').toLowerCase().trim();
      const tr_text = (item.tr_text || '').toLowerCase().trim();
      const parent_text = (item.parent_text || '').toLowerCase().trim();
      const element_text = (item.element_text || '').toLowerCase().trim();

      // combined_search_text4を作成
      const combined_search_text4 = `${element_name} ${label_text} ${siblings_text} ${tr_text} ${parent_text} ${element_text}`;

      // kanaキーワードに合致する場合はkanaに移動
      if (['kana'].some((keyword) => combined_search_text4.includes(keyword))) {
        categories['kana'].push(item);
      } else {
        categories['kanji'].push(item);
      }
    }

    // kanaに分類された要素を再分類
    for (const item of categories['kana']) {
      const element_name = (item.element_name || '').toLowerCase();
      const label_text = (item.label_text || '').toLowerCase().trim();
      const siblings_text = (item.siblings_text || '').toLowerCase().trim();
      const tr_text = (item.tr_text || '').toLowerCase().trim();
      const parent_text = (item.parent_text || '').toLowerCase().trim();
      const element_text = (item.element_text || '').toLowerCase().trim();

      const combined_search_text4 = `${element_name} ${label_text} ${siblings_text} ${tr_text} ${parent_text} ${element_text}`;

      // hiraganaキーワードに合致する場合はhiraganaに移動
      if (
        hiragana_keywords.some((keyword) =>
          combined_search_text4.includes(keyword),
        )
      ) {
        categories['hiragana'].push(item);
      } else {
        categories['katakana'].push(item);
      }
    }

    // hiraganaに分類された要素を再分類
    const hiragana_sei_matches: Array<{ item: DataItem; match_count: number }> =
      [];

    for (const item of categories['hiragana']) {
      const element_name = (item.element_name || '').toLowerCase();
      const label_text = (item.label_text || '').toLowerCase().trim();
      const siblings_text = (item.siblings_text || '').toLowerCase().trim();
      const tr_text = (item.tr_text || '').toLowerCase().trim();
      const parent_text = (item.parent_text || '').toLowerCase().trim();
      const element_text = (item.element_text || '').toLowerCase().trim();

      const combined_search_text4 = `${element_name} ${label_text} ${siblings_text} ${tr_text} ${parent_text} ${element_text}`;

      // hiragana_seiキーワードのマッチ数を数える
      const match_count = hiragana_sei_keywords.reduce((count, keyword) => {
        return combined_search_text4.includes(keyword) ? count + 1 : count;
      }, 0);

      hiragana_sei_matches.push({ item, match_count });
    }

    // マッチ数が一番多いアイテムを見つける
    if (hiragana_sei_matches.length > 0) {
      const max_match_item = hiragana_sei_matches.reduce((prev, current) => {
        return current.match_count > prev.match_count ? current : prev;
      }).item;

      categories['hiragana_sei'].push(max_match_item);

      // それ以外のアイテムはhiragana_meiに分類
      for (const { item } of hiragana_sei_matches) {
        if (item !== max_match_item) {
          categories['hiragana_mei'].push(item);
        }
      }
    }

    // hiragana_seiまたはhiragana_meiが空の場合、hiraganaの全てをhiragana_fullnameに移動
    if (
      categories['hiragana_sei'].length === 0 ||
      categories['hiragana_mei'].length === 0
    ) {
      categories['hiragana_fullname'].push(...categories['hiragana']);
      categories['hiragana'] = [];
      categories['hiragana_sei'] = [];
      categories['hiragana_mei'] = [];
    }

    // katakanaに分類された要素を再分類
    const katakana_sei_matches: Array<{ item: DataItem; match_count: number }> =
      [];

    for (const item of categories['katakana']) {
      const element_name = (item.element_name || '').toLowerCase();
      const label_text = (item.label_text || '').toLowerCase().trim();
      const siblings_text = (item.siblings_text || '').toLowerCase().trim();
      const tr_text = (item.tr_text || '').toLowerCase().trim();
      const parent_text = (item.parent_text || '').toLowerCase().trim();
      const element_text = (item.element_text || '').toLowerCase().trim();

      const combined_search_text4 = `${element_name} ${label_text} ${siblings_text} ${tr_text} ${parent_text} ${element_text}`;

      // katakana_seiキーワードのマッチ数を数える
      const match_count = katakana_sei_keywords.reduce((count, keyword) => {
        return combined_search_text4.includes(keyword) ? count + 1 : count;
      }, 0);

      katakana_sei_matches.push({ item, match_count });
    }

    // マッチ数が一番多いアイテムを見つける
    if (katakana_sei_matches.length > 0) {
      const max_match_item = katakana_sei_matches.reduce((prev, current) => {
        return current.match_count > prev.match_count ? current : prev;
      }).item;

      categories['katakana_sei'].push(max_match_item);

      // それ以外のアイテムはkatakana_meiに分類
      for (const { item } of katakana_sei_matches) {
        if (item !== max_match_item) {
          categories['katakana_mei'].push(item);
        }
      }
    }

    // katakana_seiまたはkatakana_meiが空の場合、katakanaの全てをkatakana_fullnameに移動
    if (
      categories['katakana_sei'].length === 0 ||
      categories['katakana_mei'].length === 0
    ) {
      categories['katakana_fullname'].push(...categories['katakana']);
      categories['katakana'] = [];
      categories['katakana_sei'] = [];
      categories['katakana_mei'] = [];
    }

    // kanjiに分類された要素を再分類
    const kanji_sei_matches: Array<{ item: DataItem; match_count: number }> =
      [];

    for (const item of categories['kanji']) {
      const element_name = (item.element_name || '').toLowerCase();
      const label_text = (item.label_text || '').toLowerCase().trim();
      const siblings_text = (item.siblings_text || '').toLowerCase().trim();
      const tr_text = (item.tr_text || '').toLowerCase().trim();
      const parent_text = (item.parent_text || '').toLowerCase().trim();
      const element_text = (item.element_text || '').toLowerCase().trim();

      const combined_search_text4 = `${element_name} ${label_text} ${siblings_text} ${tr_text} ${parent_text} ${element_text}`;

      // kanji_seiキーワードのマッチ数を数える
      const match_count = kanji_sei_keywords.reduce((count, keyword) => {
        return combined_search_text4.includes(keyword) ? count + 1 : count;
      }, 0);

      kanji_sei_matches.push({ item, match_count });
    }

    // マッチ数が一番多いアイテムを見つける
    if (kanji_sei_matches.length > 0) {
      const max_match_item = kanji_sei_matches.reduce((prev, current) => {
        return current.match_count > prev.match_count ? current : prev;
      }).item;

      categories['kanji_sei'].push(max_match_item);

      // それ以外のアイテムはkanji_meiに分類
      for (const { item } of kanji_sei_matches) {
        if (item !== max_match_item) {
          categories['kanji_mei'].push(item);
        }
      }
    }

    // kanji_seiまたはkanji_meiが空の場合、kanjiの全てをkanji_fullnameに移動
    if (
      categories['kanji_sei'].length === 0 ||
      categories['kanji_mei'].length === 0
    ) {
      categories['kanji_fullname'].push(...categories['kanji']);
      categories['kanji'] = [];
      categories['kanji_sei'] = [];
      categories['kanji_mei'] = [];
    }

    // 内容をクリア
    categories['hiragana'] = [];
    categories['kana'] = [];
    categories['kanji'] = [];
    categories['katakana'] = [];
    categories['name'] = [];

    // 住所が複数ある場合に細分化する処理
    if (categories['address'].length > 1) {
      for (const item of categories['address']) {
        const combined_text = `${item.element_name} ${item.label_text} ${item.element_text}`;

        // 郵便番号、都道府県、市区町村、番地に細分化
        if (
          address_zip_keywords.some((keyword) =>
            combined_text.includes(keyword),
          )
        ) {
          categories['address_zip'].push(item);
        } else if (
          address_prefecture_keywords.some((keyword) =>
            combined_text.includes(keyword),
          )
        ) {
          categories['address_prefecture'].push(item);
        } else if (
          address_city_keywords.some((keyword) =>
            combined_text.includes(keyword),
          )
        ) {
          categories['address_city'].push(item);
        } else if (
          address_street_keywords.some((keyword) =>
            combined_text.includes(keyword),
          )
        ) {
          categories['address_street'].push(item);
        }
      }

      // address_streetが見つかり、address_prefectureかaddress_cityが見つかった場合、addressを無効にする
      if (
        categories['address_street'].length > 0 &&
        (categories['address_prefecture'].length > 0 ||
          categories['address_city'].length > 0)
      ) {
        categories['address'] = [];
      }
      // address_streetが見つかり、address_prefectureもaddress_cityも見つからない場合、address_streetを無効にする
      else if (
        categories['address_street'].length > 0 &&
        categories['address_prefecture'].length === 0 &&
        categories['address_city'].length === 0
      ) {
        categories['address_street'] = [];
      }
    }

    // 郵便番号が3つ以上ある場合に細分化する処理
    if (categories['post_code'].length > 2) {
      for (const item of categories['post_code']) {
        const combined_text = `${item.element_name} ${item.label_text} ${item.element_text}`;

        // 郵便番号、都道府県、市区町村、番地に細分化
        if (
          address_zip_keywords.some((keyword) =>
            combined_text.includes(keyword),
          )
        ) {
          categories['address_zip'].push(item);
        } else if (
          address_prefecture_keywords.some((keyword) =>
            combined_text.includes(keyword),
          )
        ) {
          categories['address_prefecture'].push(item);
        } else if (
          address_city_keywords.some((keyword) =>
            combined_text.includes(keyword),
          )
        ) {
          categories['address_city'].push(item);
        } else if (
          address_street_keywords.some((keyword) =>
            combined_text.includes(keyword),
          )
        ) {
          categories['address_street'].push(item);
        }
      }

      // 細分化後にpost_codeカテゴリをクリア
      categories['post_code'] = [];
    }

    // address_zipに分類された要素をpost_codeに移動
    if (categories['address_zip'].length > 0) {
      categories['post_code'].push(...categories['address_zip']); // address_zipの要素をpost_codeに追加
      categories['address_zip'] = []; // address_zipをクリア
    }

    return categories;
  }

  /**
   * フォーム要素を処理し、ページ上の入力フィールド、セレクトボックス、チェックボックス、テキストエリアなどを抽出して、
   * コンテキスト情報とともに表示および収集します。また、"Agreement" または "Mistake" に関連するチェックボックスを検索します。
   *
   * @param {WebDriver} driver - WebDriverのインスタンス。
   * @param {WebElement[]} formElements - 処理するフォーム要素の配列。
   * @param {Set<WebElement>} printedElements - 既に処理された要素を追跡するセット。
   * @param {ExtractedData[]} extractedData - 抽出されたデータを格納する配列。
   * @param {any[]} agreementDetails - 同意に関する詳細情報を格納する配列。
   * @returns {Promise<void>} - 処理が完了すると解決されるPromise。
   */
  async handleFormElementsAndSearchCheckboxes(
    driver: WebDriver,
    formElements: WebElement[],
    printedElements: Set<WebElement>,
    extractedData: ExtractedData[],
    agreementDetails: any[],
    foundAgreementCheckbox: boolean,
    inquiryBody: string,
  ): Promise<void> {
    if (formElements && formElements.length > 0) {
      for (const formElement of formElements) {
        // 入力フィールド、セレクトボックス、チェックボックス、テキストエリア要素を抽出
        const inputs = await formElement.findElements(By.tagName('input'));
        const selects = await formElement.findElements(By.tagName('select'));
        const textareas = await formElement.findElements(
          By.tagName('textarea'),
        );

        const checkboxes: WebElement[] = [];
        for (const el of inputs) {
          const type = await el.getAttribute('type');
          if (type === 'checkbox') {
            checkboxes.push(el);
          }
        }

        // フォーム要素のテキスト（30文字まで）を表示
        const formElementText = await formElement.getText();
        console.log(
          `Form element text: ${formElementText.substring(0, 30)}...`,
        );

        // コンテキストとともに抽出した要素を表示
        await this.printElementsWithContext(
          inputs,
          'Input',
          printedElements,
          extractedData,
        );
        await this.printElementsWithContext(
          selects,
          'Select',
          printedElements,
          extractedData,
        );
        await this.printElementsWithContext(
          checkboxes,
          'Checkbox',
          printedElements,
          extractedData,
        );
        await this.printElementsWithContext(
          textareas,
          'Textarea',
          printedElements,
          extractedData,
        );

        // "Agreement" または "Mistake" に関連するチェックボックスを検索
        await this.findAgreementCheckboxes(
          checkboxes,
          driver,
          agreementDetails,
          foundAgreementCheckbox,
          inquiryBody,
        );
      }
    } else {
      // フォーム要素が見つからなかった場合、iframe内をチェック
      console.log('Form elements not found. Checking for iframes...');
      // ページが完全に読み込まれるまで待機
      try {
        await driver.wait(async () => {
          const readyState = await driver.executeScript(
            'return document.readyState',
          );
          return readyState === 'complete';
        }, 20000);

        await driver.wait(until.elementsLocated(By.tagName('iframe')), 20000);

        // iframe要素を取得し、各iframeに対して処理を行う
        const iframes = await driver.findElements(By.tagName('iframe'));
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe); // iframeに切り替え
          const inputsInIframe = await driver.findElements(By.tagName('input'));
          const selectsInIframe = await driver.findElements(
            By.tagName('select'),
          );

          const checkboxesInIframe: WebElement[] = [];
          for (const el of inputsInIframe) {
            const type = await el.getAttribute('type');
            if (type === 'checkbox') {
              checkboxesInIframe.push(el);
            }
          }

          // iframe内の要素を処理
          await this.printElementsWithContext(
            inputsInIframe,
            'Input in iframe',
            printedElements,
            extractedData,
          );
          await this.printElementsWithContext(
            checkboxesInIframe,
            'Checkbox in iframe',
            printedElements,
            extractedData,
          );
          await this.printElementsWithContext(
            selectsInIframe,
            'Select in iframe',
            printedElements,
            extractedData,
          );

          // iframe内で "Agreement" または "Mistake" チェックボックスを検索
          await this.findAgreementCheckboxes(
            checkboxesInIframe,
            driver,
            agreementDetails,
            foundAgreementCheckbox,
            inquiryBody,
          );

          await driver.switchTo().defaultContent(); // メインコンテンツに戻る
        }
      } catch (e) {
        if (e instanceof error.TimeoutError) {
          console.log('iframe not found. Ending script.');
        } else {
          console.error(`An error occurred: ${e}`);
        }
      }

      // フォームが見つからない場合、input要素全体を探索
      console.log(
        'フォーム要素が見つかりませんでした。ページ全体からinput要素を検索します...',
      );
      const inputs = await driver.findElements(By.tagName('input'));
      if (inputs.length > 0) {
        await this.printElementsWithContext(
          inputs,
          'Input',
          printedElements,
          extractedData,
        );
      } else {
        // input要素も見つからない場合は、iframeを再確認
        console.log('input要素が見つかりませんでした。iframeを確認します...');
        try {
          await driver.wait(until.elementsLocated(By.tagName('iframe')), 3000);
          const iframes = await driver.findElements(By.tagName('iframe'));
          if (iframes.length > 0) {
            for (const iframe of iframes) {
              await driver.switchTo().frame(iframe);
              const inputsInIframe = await driver.findElements(
                By.tagName('input'),
              );
              const selectsInIframe = await driver.findElements(
                By.tagName('select'),
              );

              // iframe内のinputとselect要素を表示
              await this.printElementsWithContext(
                inputsInIframe,
                'Input in iframe',
                printedElements,
                extractedData,
              );
              await this.printElementsWithContext(
                selectsInIframe,
                'Select in iframe',
                printedElements,
                extractedData,
              );

              await driver.switchTo().defaultContent();
            }
          } else {
            // iframeも見つからない場合、textareaを確認
            console.log(
              'iframeも見つかりませんでした。ページ全体からtextareaを検索し、入力します...',
            );
            const textareas = await driver.findElements(By.tagName('textarea'));
            for (const textarea of textareas) {
              await textarea.sendKeys(inquiryBody); // テキストエリアにメッセージを入力 ★
              const name = await textarea.getAttribute('name');
              console.log(`Textarea input successful for ${name}.`);
            }
          }
        } catch (e) {
          console.error(`An error occurred while checking iframes: ${e}`);
        }
      }
    }
  }

  /**
   * Web要素のリストを処理し、親テキスト、兄弟テキスト、関連するラベルなどのコンテキスト情報を収集して表示します。
   * また、これらの情報を配列に収集してさらなる処理に使用します。
   *
   * @param {WebElement[]} elements - 処理するWebElementの配列。
   * @param {string} elementType - 処理する要素の種類（例：'input', 'button'）。
   * @param {Set<string>} printedElements - 重複を避けるために既に処理された要素の識別子のセット。
   * @param {ExtractedData[]} extractedData - 各要素から抽出されたデータを収集する配列。
   * @returns {Promise<void>} - 処理が完了すると解決されるPromise。
   */
  async printElementsWithContext(
    elements: WebElement[],
    elementType: string,
    printedElements: Set<string>,
    extractedData: ExtractedData[],
  ): Promise<void> {
    for (const element of elements) {
      const isDisplayed = await element.isDisplayed(); // 要素が表示されているか確認
      if (isDisplayed) {
        // 要素の属性を取得
        const name = await element.getAttribute('name');
        const id = await element.getAttribute('id');
        const type = await element.getAttribute('type');
        const className = await element.getAttribute('class');

        // 識別子を作成
        const identifier = `${name}-${id}-${type}-${className}`;

        if (!printedElements.has(identifier)) {
          // まだ印刷されていない要素をチェック
          // 親要素を取得
          const parent = await element.findElement(By.xpath('..'));
          const parentText = parent ? (await parent.getText()).trim() : '';

          // 兄弟要素を取得
          const siblings = await parent.findElements(By.xpath('./*'));
          const siblingsText: string = siblings
            .filter((sib) => sib !== element) // 指定された要素以外をフィルタリング
            .map((sib) => (sib.text ?? '').trim()) // text が undefined の場合は空文字を使用
            .join(' '); // スペースで結合

          // 現在の要素のテキストを取得
          const currentText = (await element.getText()).trim();

          // 要素のクラス名を取得
          const class_name = className;

          // ラベルを取得
          let label = '';
          try {
            const labelElement = await parent.findElement(
              By.xpath(`//label[@for='${id}']`),
            );
            label = (await labelElement.getText()).trim();
          } catch (e) {
            label = '';
          }

          // 親要素を<tr>まで遡って、そのテキストを取得
          let tr_text = '';
          let tr_element = parent;
          while (true) {
            const tagName = await tr_element.getTagName();
            if (tagName.toLowerCase() === 'html') {
              break;
            }
            if (tagName.toLowerCase() === 'tr') {
              tr_text = (await tr_element.getText()).trim();
              break;
            }
            tr_element = await tr_element.findElement(By.xpath('..'));
          }

          // 要素名を取得
          const element_name = name || id || type;

          // 要素情報を表示
          // console.log('-'.repeat(21));
          // console.log(`要素名: ${element_name}`);
          // console.log(`要素のテキスト: ${currentText}`);
          // console.log(`親要素のテキスト: ${parentText}`);
          // console.log(`兄弟要素のテキスト: ${siblingsText}`);
          // console.log(`クラス名: ${class_name}`);
          // console.log(`ラベル: ${label}`);
          // console.log(`形式: ${elementType}`);
          // console.log(`TR要素のテキスト: ${tr_text}`);
          // console.log('-'.repeat(21));

          // 抽出データに追加
          extractedData.push({
            id: null,
            category: null,
            element_name: element_name,
            element_value: null,
            element_text: currentText,
            parent_text: parentText,
            siblings_text: siblingsText,
            class_name: class_name,
            label_text: label,
            element_type: elementType,
            tr_text: tr_text,
          });

          // 印刷済みの要素としてセットに追加
          printedElements.add(identifier);
        }
      }
    }
  }

  /**
   * 同意や間違いに関連するチェックボックスを検索し、見つかった場合はクリックして選択する関数
   * @param {WebElement[]} checkboxes - 処理対象のチェックボックス要素の配列。
   * @param {WebDriver} driver - Selenium WebDriver のインスタンス。
   * @param {boolean} foundAgreementCheckbox - 同意チェックボックスが見つかったかどうかを示すオブジェクト（参照渡し）。
   * @param {any[]} agreementDetails - チェックボックスの詳細情報を格納する配列。
   * @returns {Promise<void>} この関数は非同期処理を行うため、Promiseを返します。
   */
  async findAgreementCheckboxes(
    checkboxes: WebElement[],
    driver: WebDriver,
    agreementDetails: any[],
    foundAgreementCheckbox: boolean,
    inquiryBody: string,
  ): Promise<void> {
    for (const checkbox of checkboxes) {
      let checkboxLabel = ''; // チェックボックスのラベルテキストを格納する変数
      try {
        // チェックボックスの隣接するラベルを探す
        const labelElement = await checkbox.findElement(
          By.xpath('following-sibling::label'),
        );
        checkboxLabel = (await labelElement.getText()).toLowerCase();
      } catch (e) {
        if (e instanceof error.NoSuchElementError) {
          try {
            // 隣接するラベルが見つからない場合は、親要素にあるラベルを探す
            const labelElement = await checkbox.findElement(
              By.xpath('../label'),
            );
            checkboxLabel = (await labelElement.getText()).toLowerCase();
          } catch (e) {
            if (e instanceof error.NoSuchElementError) {
              // ラベルが見つからない場合は何もしない
            } else {
              throw e;
            }
          }
        } else {
          throw e;
        }
      }

      // チェックボックスの親要素のテキストも確認
      const parent = await checkbox.findElement(By.xpath('..'));
      const parentText = (await parent.getText()).toLowerCase();

      // ラベルや親要素のテキストに特定のキーワードが含まれているか確認
      const keywords = [
        '同意',
        '確認',
        '間違い',
        '承認',
        'プライバシー',
        '承知',
        'メルマガ',
      ];
      if (
        keywords.some((keyword) => checkboxLabel.includes(keyword)) ||
        keywords.some((keyword) => parentText.includes(keyword))
      ) {
        foundAgreementCheckbox = true; // 同意チェックボックスが見つかったことを示す
        agreementDetails.push({
          element: checkbox,
          label_text: checkboxLabel,
          is_selected: await checkbox.isSelected(), // チェックボックスがすでに選択されているかどうか
        });

        // チェックボックスが未選択の場合、JavaScriptでクリックして選択
        const isSelected = await checkbox.isSelected();
        if (!isSelected) {
          try {
            await driver.executeScript(
              'arguments[0].scrollIntoView(true);',
              checkbox,
            );
            await driver.executeScript('arguments[0].click();', checkbox);
            console.log(`Checked checkbox with label: ${checkboxLabel}`);
          } catch (e) {
            console.log(
              `Failed to check checkbox with label: ${checkboxLabel}. Error: ${e}`,
            );
          }
        }
      }
    }
  }

  /**
   * テキストエリアにテキストを入力する関数
   * @param driver WebDriverのインスタンス
   * @param extractedData 抽出されたデータの配列
   * @param inquiryBody お問い合わせ本文
   */
  async inputTextToTextarea(
    driver: WebDriver,
    extractedData: ExtractedData[],
    inquiryBody: string,
  ): Promise<void> {
    // テキストエリアに入力する処理を追加
    for (const item of extractedData) {
      // テキストエリアの要素である場合の処理
      if (item['element_type'] === 'Textarea') {
        try {
          // 該当のテキストエリア要素が見つかるまで待機
          const textareaElement: WebElement = await driver.wait(
            until.elementLocated(By.name(item['element_name'])),
            3000, // 10秒間待機
          );

          // テキストエリアが空かどうかを確認
          const currentText = await textareaElement.getAttribute('value'); // 現在のテキストを取得

          if (currentText === '') {
            // テキストエリアが空の場合のみテキストを入力
            await textareaElement.sendKeys(inquiryBody); // デフォルトのテキストを入力 ★
            console.log(
              `Textarea input successful for ${item['element_name']}.`,
            ); // 入力成功のメッセージ
          } else {
            console.log(
              `Textarea already filled: ${item['element_name']}. No action taken.`,
            ); // テキストが既に入力済みである場合
          }
        } catch (error) {
          if (error.name === 'TimeoutError') {
            // 指定した時間内にテキストエリアが見つからなかった場合のエラーハンドリング
            console.log(
              `Timeout occurred: Textarea with name ${item['element_name']} not found.`,
            );

            // ページに存在するすべてのテキストエリアを出力してデバッグ用に表示
            const allTextareas = await driver.findElements(
              By.tagName('textarea'),
            );
            console.log('All available textareas:');
            for (const textarea of allTextareas) {
              const name = await textarea.getAttribute('name');
              const id = await textarea.getAttribute('id');
              console.log(`Name: ${name}, ID: ${id}`); // 名前とIDを表示
            }
          } else {
            throw error;
          }
        }
      }
    }
  }

  /**
   * ページ上に存在するすべてのテキストエリアを処理する関数。
   * 各テキストエリアに対して、内容が空であればデフォルトのメッセージを入力する。
   * @param driver WebDriverのインスタンス
   */
  async processTextareas(
    driver: WebDriver,
    inquiryBody: string,
  ): Promise<void> {
    // ページ全体からテキストエリア要素を取得
    const textareas: WebElement[] = await driver.findElements(
      By.tagName('textarea'),
    );
    for (const textarea of textareas) {
      await this.processTextareaElement(driver, textarea, inquiryBody); // 各テキストエリアの処理を行う
    }
  }

  /**
   * 個々のテキストエリア要素を処理する関数。
   * 空のテキストエリアに「お問い合わせ内容です」を入力する。
   * @param driver WebDriverのインスタンス
   * @param textarea テキストエリアのWebElement
   * @param inquiryBody お問い合わせ本文
   */
  async processTextareaElement(
    driver: WebDriver,
    textarea: WebElement,
    inquiryBody: string,
  ): Promise<void> {
    // テキストエリアの名前と現在のテキスト内容を取得
    const name = await textarea.getAttribute('name');
    const currentText = await textarea.getAttribute('value');

    // g-recaptchaのフィールドを除外し、かつ内容が空である場合にのみ処理
    if (name !== 'g-recaptcha-response' && currentText === '') {
      try {
        // 要素が表示されてクリック可能になるまで待機
        await driver.wait(until.elementIsVisible(textarea), 3000);
        await driver.wait(until.elementIsEnabled(textarea), 3000);

        // テキストエリアが表示されていて、操作可能か確認
        const isDisplayed = await textarea.isDisplayed();
        const isEnabled = await textarea.isEnabled();

        if (isDisplayed && isEnabled) {
          await textarea.sendKeys(inquiryBody); // 空の場合はデフォルトメッセージを入力 ★
          console.log(`Filling textarea (Name: ${name}) with default message.`); // 入力成功メッセージ
        } else {
          console.log(`Textarea (Name: ${name}) is not interactable.`);
        }
      } catch (e) {
        console.log(`Error interacting with textarea (Name: ${name}): ${e}`); // エラーメッセージ
      }
    } else if (name !== 'g-recaptcha-response') {
      console.log(`Textarea already filled: ${name}. No action taken.`); // テキストエリアが既に埋まっている場合のメッセージ
    }
  }

  /**
   * iframeのテキストエリアも処理する関数(hogehoge3)
   * @param driver WebDriverのインスタンス
   * @param iframes 処理するiframeの配列
   * @param inquiryBody お問い合わせ本文
   */
  async handleIframeTextareaElements(
    driver: WebDriver,
    iframes: WebElement[],
    inquiryBody: string,
  ): Promise<void> {
    // iframeのテキストエリアも処理
    for (const iframe of iframes) {
      await driver.switchTo().frame(iframe); // 各iframeに切り替え
      await this.processTextareas(driver, inquiryBody); // iframe内のテキストエリアも処理
      await driver.switchTo().defaultContent(); // 元のコンテンツに戻る
    }

    try {
      // ページからすべての<textarea>要素を見つける
      const textareaElements = await driver.wait(
        until.elementsLocated(By.tagName('textarea')),
        3000, // 10秒間待機
      );

      // <textarea>要素が存在する場合の処理
      if (textareaElements.length > 0) {
        console.log('Found textarea elements:'); // テキストエリアが見つかった場合のメッセージ
        for (const textarea of textareaElements) {
          const name = await textarea.getAttribute('name');
          if (name !== 'g-recaptcha-response') {
            // reCAPTCHAフィールドを除外
            // テキストエリアがクリック可能になるまで待つ
            await driver.wait(until.elementIsEnabled(textarea), 3000);
            // テキストエリアが空かどうか確認
            const currentText = await textarea.getAttribute('value');
            if (currentText === '') {
              // 空の場合のみテキストを入力
              await textarea.sendKeys(inquiryBody); // デフォルトメッセージを入力
              console.log(
                `Filling textarea (Name: ${name}) with default message.`,
              ); // 入力成功メッセージ
            } else {
              console.log(`Textarea already filled: ${name}. No action taken.`); // 既に入力されている場合のメッセージ
            }
          }
        }
      }
    } catch (e) {
      // 何らかのエラーが発生した場合のエラーハンドリング
      console.log(`An error occurred: ${e}`);
    }
  }

  /**
   * iframe内のinput要素とtextarea要素を処理する関数(hogehoge4)
   * @param driver WebDriverのインスタンス
   * @param iframes 処理するiframeの配列
   * @param printedElements 出力済みの要素のリスト
   * @param extractedData 抽出されたデータのオブジェクト
   * @param emailAddress メールアドレス
   * @param phoneNumber 電話番号
   * @param inquiryBody お問い合わせ本文
   */
  async handleIframeInputAndTextareaElements(
    driver: WebDriver,
    iframes: WebElement[],
    printedElements: Set<WebElement>,
    extractedData: any,
    emailAddress: string,
    phoneNumber: string,
    inquiryBody: string,
  ): Promise<void> {
    for (let index = 0; index < iframes.length; index++) {
      const iframe = iframes[index];

      // 各iframeに切り替え
      await driver.switchTo().frame(iframe);

      // 現在のiframe内でのinput要素をすべて取得
      const inputs = await driver.findElements(By.tagName('input'));
      console.log(`Inputs found in iframe ${index}: ${inputs.length}`); // 取得したinput要素の数を表示

      // それぞれのinput要素を確認
      for (const inputElement of inputs) {
        const inputType = await inputElement.getAttribute('type'); // inputのtype属性を取得
        const inputValue = await inputElement.getAttribute('value'); // inputの現在の値を取得

        // 入力が空である場合のみ、以下の処理を実行
        if (!inputValue) {
          // inputのtypeが'email'である場合
          if (inputType === 'email') {
            console.log(`Empty email input found in iframe ${index}`); // 空のemail入力フィールドを見つけたことを表示
            await inputElement.sendKeys(emailAddress); // テスト用のメールアドレスを入力
            console.log('Email input successful.'); // 入力成功メッセージ
          }
          // inputのtypeが'tel'である場合
          else if (inputType === 'tel') {
            console.log(`Empty phone input found in iframe ${index}`); // 空の電話番号入力フィールドを見つけたことを表示
            await inputElement.sendKeys(phoneNumber); // テスト用の電話番号を入力
            console.log('Phone input successful.'); // 入力成功メッセージ
          }
        }
      }

      // テキストエリアを探す
      const textareasInIframe = await driver.findElements(
        By.tagName('textarea'),
      ); // iframe内のtextarea要素を取得

      // テキストエリアの情報を表示して処理
      await this.printElementsWithContext(
        textareasInIframe,
        'Textarea in iframe',
        printedElements,
        extractedData,
      );

      // テキストエリアに入力する処理を追加
      for (const textareaItem of textareasInIframe) {
        try {
          // テキストエリアの内容が空かどうか確認
          const currentValue = await textareaItem.getAttribute('value');
          if (!currentValue) {
            // テキストエリアが表示されていてクリック可能になるまで待つ
            const name = await textareaItem.getAttribute('name');
            const textareaElement = await driver.wait(
              until.elementLocated(By.name(name)),
              3000, // 10秒間待機
            );
            // テキストエリアにデフォルトメッセージを入力
            await textareaElement.sendKeys(inquiryBody);
            console.log(
              `Textarea input successful for ${name} in iframe ${index}.`,
            ); // 入力成功メッセージ
          } else {
            // 既に内容が入力されている場合のメッセージ
            console.log(
              `Textarea in iframe ${index} already contains text. Skipping input.`,
            );
          }
        } catch (e) {
          // エラーハンドリング: テキストエリアへの入力が失敗した場合
          console.log(`Failed to input textarea in iframe ${index}: ${e}`);
        }
      }

      // 元のコンテンツ（iframe外）に戻る
      await driver.switchTo().defaultContent();
    }
  }

  /**
   * trタグ内に名前を入れる処理
   *
   * @param driver - Selenium WebDriverのインスタンス
   * @param inquiryData - お問い合わせ情報
   */
  async handleNameInputTableElements(
    driver: WebDriver,
    inquiryData: { [key: string]: string },
  ): Promise<void> {
    // 「th」タグのテキストが「お名前」または「氏名」を含む要素を探す
    let thKanjiElements = await driver.findElements(
      By.xpath("//th[contains(., 'お名前')]"),
    );
    if (thKanjiElements.length !== 0) {
      // 漢字フルネーム入力処理
      for (let thKanjiElement of thKanjiElements) {
        try {
          // XPathで「th」の次の兄弟「td」を探し、その中のすべてのinputを取得
          let inputElements = await thKanjiElement.findElements(
            By.xpath("following-sibling::td//input[@type='text']"),
          );
          // 取得したinput要素の量によって、フルネームか姓名に分けるか選択し入力
          if (inputElements.length === 2) {
            // 姓名に分けて入力
            for (let i = 0; inputElements.length > i; i++) {
              if ((i = 0)) {
                await inputElements[i].sendKeys(inquiryData.lastName);
                console.log(inquiryData.lastName, 'を入力しました。');
              }
              if ((i = 1)) {
                await inputElements[i].sendKeys(inquiryData.firstName);
                console.log(inquiryData.firstName, 'を入力しました。');
              }
            }
          } else if (inputElements.length === 1) {
            // フルネームを入力
            for (let inputElement of inputElements) {
              await inputElement.sendKeys(
                inquiryData.lastName + inquiryData.firstName,
              );
              console.log(
                inquiryData.lastName + inquiryData.firstName,
                'を入力しました。',
              );
            }
          } else if (inputElements.length === 0) {
            console.warn('対応するinput要素(お名前)が見つかりませんでした。');
          }
        } catch (innerErr) {
          console.error(
            '漢字フルネームの処理中にエラーが発生しました:',
            innerErr,
          );
        }
      }
    } else {
      console.log(
        '「お名前」というテキストを含むthタグが見つかりませんでした。',
      );
    }

    // 「th」タグのテキストが「ふりがな」を含む要素を探す
    let thHiraganaElements = await driver.findElements(
      By.xpath(
        "//th[contains(., 'ふり')or contains(., 'がな')or contains(., 'かな')]",
      ),
    );
    if (thHiraganaElements.length !== 0) {
      // ふりがなフルネーム入力処理
      for (let thHiraganaElement of thHiraganaElements) {
        try {
          // XPathで「th」の次の兄弟「td」を探し、その中のすべてのinputを取得
          let inputElements = await thHiraganaElement.findElements(
            By.xpath("following-sibling::td//input[@type='text']"),
          );
          // 取得したinput要素の量によって、フルネームか姓名に分けるか選択し入力
          if (inputElements.length === 2) {
            // 姓名に分けて入力
            for (let i = 0; inputElements.length > i; i++) {
              if ((i = 0)) {
                await inputElements[i].sendKeys(inquiryData.lastNameHiragana);
                console.log(inquiryData.lastNameHiragana, 'を入力しました。');
              }
              if ((i = 1)) {
                await inputElements[i].sendKeys(inquiryData.firstNameHiragana);
                console.log(inquiryData.firstNameHiragana, 'を入力しました。');
              }
            }
          } else if (inputElements.length === 1) {
            // フルネームを入力
            for (let inputElement of inputElements) {
              await inputElement.sendKeys(
                inquiryData.lastNameHiragana + inquiryData.firstNameHiragana,
              );
              console.log(
                inquiryData.lastNameHiragana + inquiryData.firstNameHiragana,
                'を入力しました。',
              );
            }
          } else if (inputElements.length === 0) {
            console.warn('対応するinput要素(ふりがな)が見つかりませんでした。');
          }
        } catch (innerErr) {
          console.error(
            'フリガナフルネームの処理中にエラーが発生しました:',
            innerErr,
          );
        }
      }
    } else {
      console.log(
        '「ふりがな」というテキストを含むthタグが見つかりませんでした。',
      );
    }

    // 「th」タグのテキストが「フリガナ」を含む要素を探す
    let thKatakanaElements = await driver.findElements(
      By.xpath(
        "//th[contains(., 'フリ')or contains(., 'ガナ')or contains(., 'カナ')]",
      ),
    );
    if (thKatakanaElements.length !== 0) {
      // フリガナフルネーム入力処理
      for (let thKatakanaElement of thKatakanaElements) {
        try {
          // XPathで「th」の次の兄弟「td」を探し、その中のすべてのinputを取得
          let inputElements = await thKatakanaElement.findElements(
            By.xpath("following-sibling::td//input[@type='text']"),
          );
          // 取得したinput要素の量によって、フルネームか姓名に分けるか選択し入力
          if (inputElements.length === 2) {
            // 姓名に分けて入力
            for (let i = 0; inputElements.length > i; i++) {
              if ((i = 0)) {
                await inputElements[i].sendKeys(inquiryData.lastNameKatakana);
                console.log(inquiryData.lastNameKatakana, 'を入力しました。');
              }
              if ((i = 1)) {
                await inputElements[i].sendKeys(inquiryData.firstNameKatakana);
                console.log(inquiryData.firstNameKatakana, 'を入力しました。');
              }
            }
          } else if (inputElements.length === 1) {
            // フルネームを入力
            for (let inputElement of inputElements) {
              await inputElement.sendKeys(
                inquiryData.lastNameKatakana + inquiryData.firstNameKatakana,
              );
              console.log(
                inquiryData.lastNameKatakana + inquiryData.firstNameKatakana,
                'を入力しました。',
              );
            }
          } else if (inputElements.length === 0) {
            console.warn('対応するinput要素(フリガナ)が見つかりませんでした。');
          }
        } catch (innerErr) {
          console.error(
            'フリガナフルネームの処理中にエラーが発生しました:',
            innerErr,
          );
        }
      }
    } else {
      console.log(
        '「フリガナ」というテキストを含むthタグが見つかりませんでした。',
      );
    }
  }

  /**
   * trタグ内に住所を入れる処理
   *
   * @param driver - Selenium WebDriverのインスタンス
   * @param inquiryData - お問い合わせ情報
   */
  async handleaddressInputTableElements(
    driver: WebDriver,
    inquiryData: { [key: string]: string },
  ): Promise<void> {
    // 「th」タグのテキストが「都道府県」を含む要素を探す
    let thPrefectureElements = await driver.findElements(
      By.xpath("//th[contains(., '都道府県')]"),
    );
    if (thPrefectureElements.length !== 0) {
      // 都道府県入力処理
      for (let thPrefectureElement of thPrefectureElements) {
        try {
          // XPathで「th」の次の兄弟「td」を探し、その中のすべてのinputを取得
          let inputElements = await thPrefectureElement.findElements(
            By.xpath("following-sibling::td//input[@type='text']"),
          );
          if (inputElements.length === 0) {
            console.warn('対応するinput要素(都道府県)が見つかりませんでした。');
            continue;
          }
          // 各input要素に都道府県を入力
          for (let inputElement of inputElements) {
            let prefectureData = '';
            if (inquiryData.prefecture === '東京') {
              prefectureData = inquiryData.prefecture + '都';
            } else if (
              inquiryData.prefecture === '大阪' ||
              inquiryData.prefecture === '京都'
            ) {
              prefectureData = inquiryData.prefecture + '府';
            } else if (inquiryData.prefecture === '北海道') {
              prefectureData = inquiryData.prefecture;
            } else {
              prefectureData = inquiryData.prefecture + '県';
            }
            await inputElement.sendKeys(prefectureData);
            console.log(prefectureData, 'を入力しました。');
          }
        } catch (innerErr) {
          console.error('都道府県の処理中にエラーが発生しました:', innerErr);
        }
      }
    } else {
      console.log(
        '「都道府県」というテキストを含むthタグが見つかりませんでした。',
      );
    }
    // 「th」タグのテキストが「市町村」を含む要素を探す
    let thCityElements = await driver.findElements(
      By.xpath("//th[contains(., '市町村')]"),
    );
    if (thCityElements.length !== 0) {
      // 市町村入力処理
      for (let thCityElement of thCityElements) {
        try {
          // XPathで「th」の次の兄弟「td」を探し、その中のすべてのinputを取得
          let inputElements = await thCityElement.findElements(
            By.xpath("following-sibling::td//input[@type='text']"),
          );
          if (inputElements.length === 0) {
            console.warn('対応するinput要素(市町村)が見つかりませんでした。');
            continue;
          }
          // 各input要素に市町村を入力
          for (let inputElement of inputElements) {
            await inputElement.sendKeys(inquiryData.city);
            console.log(inquiryData.city, 'を入力しました。');
          }
        } catch (innerErr) {
          console.error('市町村の処理中にエラーが発生しました:', innerErr);
        }
      }
    } else {
      console.log(
        '「市町村」というテキストを含むthタグが見つかりませんでした。',
      );
    }

    // 「th」タグのテキストが「番地」を含む要素を探す
    let thStreetAddressElements = await driver.findElements(
      By.xpath("//th[contains(., '番地')]"),
    );
    if (thStreetAddressElements.length !== 0) {
      // 番地入力処理
      for (let thStreetAddressElement of thStreetAddressElements) {
        try {
          // XPathで「th」の次の兄弟「td」を探し、その中のすべてのinputを取得
          let inputElements = await thStreetAddressElement.findElements(
            By.xpath("following-sibling::td//input[@type='text']"),
          );
          if (inputElements.length === 0) {
            console.warn('対応するinput要素(番地)が見つかりませんでした。');
            continue;
          }
          // 各input要素に番地を入力
          for (let inputElement of inputElements) {
            await inputElement.sendKeys(inquiryData.streetAddress);
            console.log(inquiryData.streetAddress, 'を入力しました。');
          }
        } catch (innerErr) {
          console.error('番地の処理中にエラーが発生しました:', innerErr);
        }
      }
    } else {
      console.log('「番地」というテキストを含むthタグが見つかりませんでした。');
    }

    // 「th」タグのテキストが「建物」「マンション」を含む要素を探す
    let thBuildingNameElements = await driver.findElements(
      By.xpath("//th[contains(., '建物') or contains(., 'マンション')]"),
    );
    if (thBuildingNameElements.length !== 0) {
      // 建物入力処理
      for (let thBuildingNameElement of thBuildingNameElements) {
        try {
          // XPathで「th」の次の兄弟「td」を探し、その中のすべてのinputを取得
          let inputElements = await thBuildingNameElement.findElements(
            By.xpath("following-sibling::td//input[@type='text']"),
          );
          if (inputElements.length === 0) {
            console.warn(
              '対応するinput要素(「建物」「マンション」)が見つかりませんでした。',
            );
            continue;
          }
          // 各input要素に建物名を入力
          for (let inputElement of inputElements) {
            await inputElement.sendKeys(inquiryData.buildingName);
            console.log(inquiryData.buildingName, 'を入力しました。');
          }
        } catch (innerErr) {
          console.error(
            '「建物」「マンション」の処理中にエラーが発生しました:',
            innerErr,
          );
        }
      }
    } else {
      console.log(
        '「建物」「マンション」というテキストを含むthタグが見つかりませんでした。',
      );
    }

    // 「th」タグのテキストが「住所」を含む要素を探す
    let thAddressElements = await driver.findElements(
      By.xpath("//th[contains(., '住所')]"),
    );
    if (thAddressElements.length !== 0) {
      // 住所入力処理
      for (let thAddressElement of thAddressElements) {
        try {
          // XPathで「th」の次の兄弟「td」を探し、その中のすべてのinputを取得
          let inputElements = await thAddressElement.findElements(
            By.xpath("following-sibling::td//input[@type='text']"),
          );
          if (inputElements.length === 0) {
            console.warn('対応するinput要素(住所)が見つかりませんでした。');
            continue;
          }
          // 各input要素に住所を入力
          for (let inputElement of inputElements) {
            const currentValue: string =
              (await inputElement.getAttribute('value')) || '';
            if (!currentValue.trim()) {
              // 入力欄が空の場合だけ入力
              let prefectureData = '';
              if (inquiryData.prefecture === '東京') {
                prefectureData = inquiryData.prefecture + '都';
              } else if (
                inquiryData.prefecture === '大阪' ||
                inquiryData.prefecture === '京都'
              ) {
                prefectureData = inquiryData.prefecture + '府';
              } else if (inquiryData.prefecture === '北海道') {
                prefectureData = inquiryData.prefecture;
              } else {
                prefectureData = inquiryData.prefecture + '県';
              }
              await inputElement.sendKeys(
                prefectureData +
                  inquiryData.city +
                  inquiryData.streetAddress +
                  inquiryData.buildingName,
              );
              console.log(
                prefectureData +
                  inquiryData.city +
                  inquiryData.streetAddress +
                  inquiryData.buildingName,
                'を入力しました。',
              );
            }
          }
        } catch (innerErr) {
          console.error('住所の処理中にエラーが発生しました:', innerErr);
        }
      }
    } else {
      console.log('「住所」というテキストを含むthタグが見つかりませんでした。');
    }
  }

  /**
   * trタグ内に部署を入れる処理
   *
   * @param driver - Selenium WebDriverのインスタンス
   * @param inquiryData - お問い合わせ情報
   */
  async handleDepartmentInputTableElements(
    driver: WebDriver,
    inquiryData: { [key: string]: string },
  ): Promise<void> {
    // テキストが「部署」を含む要素を探す
    let DepartmentElements = await driver.findElements(
      By.xpath("//th[contains(., '部署')]"),
    );
    if (DepartmentElements.length !== 0) {
      // 部署入力処理
      for (let DepartmentElement of DepartmentElements) {
        try {
          // Xpathで兄弟要素を探し、その中のすべてのinputを取得
          let inputElements = await DepartmentElement.findElements(
            By.xpath("following-sibling::td//input[@type='text']"),
          );
          for (let inputElement of inputElements) {
            const currentValue: string =
              (await inputElement.getAttribute('value')) || '';
            if (!currentValue.trim()) {
              await inputElement.sendKeys(inquiryData.department);
              console.log(inquiryData.department, 'を入力しました。');
            }
          }
        } catch (innerErr) {
          console.error('部署の処理中にエラーが発生しました:', innerErr);
        }
      }
    } else {
      console.log('「部署」というテキストを含むthタグが見つかりませんでした。');
    }
  }

  /**
   * trタグ内に会社名を入れる処理
   *
   * @param driver - Selenium WebDriverのインスタンス
   * @param inquiryData - お問い合わせ情報
   */
  async handleCorporateNameInputTableElements(
    driver: WebDriver,
    inquiryData: { [key: string]: string },
  ): Promise<void> {
    // テキストが「会社名、御社名、貴社名」を含む要素を探す
    let CorporateNameElements = await driver.findElements(
      By.xpath(
        "//th[contains(., '会社名')or contains(., '御社名')or contains(., '貴社名')]",
      ),
    );
    if (CorporateNameElements.length !== 0) {
      // 会社名、御社名、貴社名入力処理
      for (let CorporateNameElement of CorporateNameElements) {
        try {
          // Xpathで兄弟要素を探し、その中のすべてのinputを取得
          let inputElements = await CorporateNameElement.findElements(
            By.xpath("following-sibling::td//input[@type='text']"),
          );
          for (let inputElement of inputElements) {
            const currentValue: string =
              (await inputElement.getAttribute('value')) || '';
            if (!currentValue.trim()) {
              await inputElement.sendKeys(inquiryData.corporateName);
              console.log(inquiryData.corporateName, 'を入力しました。');
            }
          }
        } catch (innerErr) {
          console.error(
            '会社名、御社名、貴社名の処理中にエラーが発生しました:',
            innerErr,
          );
        }
      }
    } else {
      console.log(
        '「会社名、御社名、貴社名」というテキストを含むthタグが見つかりませんでした。',
      );
    }
  }

  /**
   * dlタグ内に名前を入れる処理
   *
   * @param driver - Selenium WebDriverのインスタンス
   * @param inquiryData - お問い合わせ情報
   */
  async handleNameInputDefinitionListElements(
    driver: WebDriver,
    inquiryData: { [key: string]: string },
  ): Promise<void> {
    // 「dt」タグのテキストが「お名前」または「氏名」を含む要素を探す
    let dtKanjiElements = await driver.findElements(
      By.xpath("//dt[contains(., 'お名前')or contains(., '氏名')]"),
    );
    if (dtKanjiElements.length !== 0) {
      // 漢字フルネーム入力処理
      for (let dtKanjiElement of dtKanjiElements) {
        try {
          // Xpathで「dt」の次の兄弟「dd」を探し、その中のすべてのinputを取得
          let inputElements = await dtKanjiElement.findElements(
            By.xpath("following-sibling::dd//input[@type='text']"),
          );
          // 取得したinput要素の量によって、フルネームか姓名に分けるか選択し入力
          if (inputElements.length === 2) {
            // 姓名に分けて入力
            for (let i = 0; inputElements.length > i; i++) {
              if ((i = 0)) {
                await inputElements[i].sendKeys(inquiryData.lastName);
                console.log(inquiryData.lastName, 'を入力しました。');
              }
              if ((i = 1)) {
                await inputElements[i].sendKeys(inquiryData.firstName);
                console.log(inquiryData.firstName, 'を入力しました。');
              }
            }
          } else if (inputElements.length === 1) {
            // フルネームを入力
            for (let inputElement of inputElements) {
              await inputElement.sendKeys(
                inquiryData.lastName + inquiryData.firstName,
              );
              console.log(
                inquiryData.lastName + inquiryData.firstName,
                'を入力しました。',
              );
            }
          } else if (inputElements.length === 0) {
            console.warn('対応するinput要素(お名前)が見つかりませんでした。');
          }
        } catch (innerErr) {
          console.error('名前漢字の処理中にエラーが発生しました:', innerErr);
        }
      }
    } else {
      console.log(
        '「お名前」というテキストを含むdtタグが見つかりませんでした。',
      );
    }

    // 「dt」タグのテキストが「ふりがな」を含む要素を探す
    let dtHiraganaElements = await driver.findElements(
      By.xpath(
        "//dt[contains(., 'ふり')or contains(., 'がな')or contains(., 'かな')]",
      ),
    );
    if (dtHiraganaElements.length !== 0) {
      // ふりがなフルネーム入力処理
      for (let dtHiraganaElement of dtHiraganaElements) {
        try {
          // XPathで「dt」の次の兄弟「dd」を探し、その中のすべてのinputを取得
          let inputElements = await dtHiraganaElement.findElements(
            By.xpath("following-sibling::dd//input[@type='text']"),
          );
          // 取得したinput要素の量によって、フルネームか姓名に分けるか選択し入力
          if (inputElements.length === 2) {
            // 姓名に分けて入力
            for (let i = 0; inputElements.length > i; i++) {
              const currentValue: string =
                (await inputElements[i].getAttribute('value')) || '';
              if (!currentValue.trim()) {
                if ((i = 0)) {
                  await inputElements[i].sendKeys(inquiryData.lastNameHiragana);
                  console.log(inquiryData.lastNameHiragana, 'を入力しました。');
                }
                if ((i = 1)) {
                  await inputElements[i].sendKeys(
                    inquiryData.firstNameHiragana,
                  );
                  console.log(
                    inquiryData.firstNameHiragana,
                    'を入力しました。',
                  );
                }
              }
            }
          } else if (inputElements.length === 1) {
            // フルネームを入力
            const currentValue: string =
              (await inputElements[0].getAttribute('value')) || '';
            if (!currentValue.trim()) {
              await inputElements[0].sendKeys(
                inquiryData.lastNameHiragana + inquiryData.firstNameHiragana,
              );
              console.log(
                inquiryData.lastNameHiragana + inquiryData.firstNameHiragana,
                'を入力しました。',
              );
            }
          } else if (inputElements.length === 0) {
            console.warn('対応するinput要素(ふりがな)が見つかりませんでした。');
          }
        } catch (innerErr) {
          console.error('ふりがなの処理中にエラーが発生しました:', innerErr);
        }
      }
    } else {
      console.log(
        '「ふりがな」というテキストを含むdtタグが見つかりませんでした。',
      );
    }

    // 「dt」タグのテキストが「フリガナ」を含む要素を探す
    let dtKatakanaElements = await driver.findElements(
      By.xpath(
        "//dt[contains(., 'フリ')or contains(., 'ガナ')or contains(., 'カナ')]",
      ),
    );
    if (dtKatakanaElements.length !== 0) {
      // フリガナフルネーム入力処理
      for (let dtKatakanaElement of dtKatakanaElements) {
        try {
          // XPathで「dt」の次の兄弟「dd」を探し、その中のすべてのinputを取得
          let inputElements = await dtKatakanaElement.findElements(
            By.xpath("following-sibling::dd//input[@type='text']"),
          );
          // 取得したinput要素の量によって、フルネームか姓名に分けるか選択し入力
          if (inputElements.length === 2) {
            // 姓名に分けて入力
            for (let i = 0; inputElements.length > i; i++) {
              const currentValue: string =
                (await inputElements[i].getAttribute('value')) || '';
              if (!currentValue.trim()) {
                if ((i = 0)) {
                  await inputElements[i].sendKeys(inquiryData.lastNameKatakana);
                  console.log(inquiryData.lastNameKatakana, 'を入力しました。');
                }
                if ((i = 1)) {
                  await inputElements[i].sendKeys(
                    inquiryData.firstNameKatakana,
                  );
                  console.log(
                    inquiryData.firstNameKatakana,
                    'を入力しました。',
                  );
                }
              }
            }
          } else if (inputElements.length === 1) {
            // フルネームを入力
            const currentValue: string =
              (await inputElements[0].getAttribute('value')) || '';
            if (!currentValue.trim()) {
              await inputElements[0].sendKeys(
                inquiryData.lastNameKatakana + inquiryData.firstNameKatakana,
              );
              console.log(
                inquiryData.lastNameKatakana + inquiryData.firstNameKatakana,
                'を入力しました。',
              );
            }
          } else if (inputElements.length === 0) {
            console.warn('対応するinput要素(フリガナ)が見つかりませんでした。');
          }
        } catch (innerErr) {
          console.error(
            'フリガナフルネームの処理中にエラーが発生しました:',
            innerErr,
          );
        }
      }
    } else {
      console.log(
        '「フリガナ」というテキストを含むdtタグが見つかりませんでした。',
      );
    }
  }

  /**
   * dlタグ内に住所を入れる処理
   *
   * @param driver - Selenium WebDriverのインスタンス
   * @param inquiryData - お問い合わせ情報
   */
  async handleAddressInputDefinitionListElements(
    driver: WebDriver,
    inquiryData: { [key: string]: string },
  ): Promise<void> {
    // 「dt」タグのテキストが「都道府県」を含む要素を探す
    let dtPrefectureElements = await driver.findElements(
      By.xpath("//dt[contains(., '都道府県')]"),
    );
    if (dtPrefectureElements.length !== 0) {
      // フリガナフルネーム入力処理
      for (let dtPrefectureElement of dtPrefectureElements) {
        try {
          // XPathで「dt」の次の兄弟「dd」を探し、その中のすべてのinputを取得
          let inputElements = await dtPrefectureElement.findElements(
            By.xpath("following-sibling::dd//input[@type='text']"),
          );
          if (inputElements.length === 0) {
            console.warn('対応するinput要素(都道府県)が見つかりませんでした。');
            continue;
          }
          // 各input要素に都道府県を入力
          for (let inputElement of inputElements) {
            let prefectureData = '';
            if (inquiryData.prefecture === '東京') {
              prefectureData = inquiryData.prefecture + '都';
            } else if (
              inquiryData.prefecture === '大阪' ||
              inquiryData.prefecture === '京都'
            ) {
              prefectureData = inquiryData.prefecture + '府';
            } else if (inquiryData.prefecture === '北海道') {
              prefectureData = inquiryData.prefecture;
            } else {
              prefectureData = inquiryData.prefecture + '県';
            }
            const currentValue: string =
              (await inputElement.getAttribute('value')) || '';
            if (!currentValue.trim()) {
              await inputElement.sendKeys(prefectureData);
              console.log(prefectureData, 'を入力しました。');
            }
          }
        } catch (innerErr) {
          console.error('都道府県の処理中にエラーが発生しました:', innerErr);
        }
      }
    } else {
      console.log(
        '「都道府県」というテキストを含むdtタグが見つかりませんでした。',
      );
    }
    // 「dt」タグのテキストが「市町村」を含む要素を探す
    let dtCityElements = await driver.findElements(
      By.xpath("//dt[contains(., '市町村')]"),
    );
    if (dtCityElements.length !== 0) {
      // フリガナフルネーム入力処理
      for (let dtCityElement of dtCityElements) {
        try {
          // XPathで「dt」の次の兄弟「dd」を探し、その中のすべてのinputを取得
          let inputElements = await dtCityElement.findElements(
            By.xpath("following-sibling::dd//input[@type='text']"),
          );
          if (inputElements.length === 0) {
            console.warn('対応するinput要素(市町村)が見つかりませんでした。');
            continue;
          }
          // 各input要素に市町村を入力
          for (let inputElement of inputElements) {
            const currentValue: string =
              (await inputElement.getAttribute('value')) || '';
            if (!currentValue.trim()) {
              await inputElement.sendKeys(inquiryData.city);
              console.log(inquiryData.city, 'を入力しました。');
            }
          }
        } catch (innerErr) {
          console.error('市町村の処理中にエラーが発生しました:', innerErr);
        }
      }
    } else {
      console.log(
        '「市町村」というテキストを含むdtタグが見つかりませんでした。',
      );
    }

    // 「dt」タグのテキストが「番地」を含む要素を探す
    let dtStreetAddressElements = await driver.findElements(
      By.xpath("//dt[contains(., '番地')]"),
    );
    if (dtStreetAddressElements.length !== 0) {
      // 番地入力処理
      for (let dtStreetAddressElement of dtStreetAddressElements) {
        try {
          // XPathで「dt」の次の兄弟「dd」を探し、その中のすべてのinputを取得
          let inputElements = await dtStreetAddressElement.findElements(
            By.xpath("following-sibling::dd//input[@type='text']"),
          );
          if (inputElements.length === 0) {
            console.warn('対応するinput要素(番地)が見つかりませんでした。');
            continue;
          }
          // 各input要素に番地を入力
          for (let inputElement of inputElements) {
            const currentValue: string =
              (await inputElement.getAttribute('value')) || '';
            if (!currentValue.trim()) {
              await inputElement.sendKeys(inquiryData.streetAddress);
              console.log(inquiryData.streetAddress, 'を入力しました。');
            }
          }
        } catch (innerErr) {
          console.error('番地の処理中にエラーが発生しました:', innerErr);
        }
      }
    } else {
      console.log('「番地」というテキストを含むdtタグが見つかりませんでした。');
    }

    // 「dt」タグのテキストが「建物」「マンション」を含む要素を探す
    let dtBuildingNameElements = await driver.findElements(
      By.xpath("//dt[contains(., '建物') or contains(., 'マンション')]"),
    );
    if (dtBuildingNameElements.length !== 0) {
      // 番地入力処理
      for (let dtBuildingNameElement of dtBuildingNameElements) {
        try {
          // XPathで「dt」の次の兄弟「dd」を探し、その中のすべてのinputを取得
          let inputElements = await dtBuildingNameElement.findElements(
            By.xpath("following-sibling::dd//input[@type='text']"),
          );
          if (inputElements.length === 0) {
            console.warn(
              '対応するinput要素(「建物」「マンション」)が見つかりませんでした。',
            );
            continue;
          }
          // 各input要素に建物名を入力
          for (let inputElement of inputElements) {
            const currentValue: string =
              (await inputElement.getAttribute('value')) || '';
            if (!currentValue.trim()) {
              await inputElement.sendKeys(inquiryData.buildingName);
              console.log(inquiryData.buildingName, 'を入力しました。');
            }
          }
        } catch (innerErr) {
          console.error(
            '「建物」「マンション」の処理中にエラーが発生しました:',
            innerErr,
          );
        }
      }
    } else {
      console.log(
        '「建物」「マンション」というテキストを含むdtタグが見つかりませんでした。',
      );
    }

    // 「dt」タグのテキストが「住所」を含む要素を探す
    let dtAddressElements = await driver.findElements(
      By.xpath("//dt[contains(., '住所')]"),
    );
    if (dtAddressElements.length !== 0) {
      // 住所入力処理
      for (let dtAddressElement of dtAddressElements) {
        try {
          // XPathで「dt」の次の兄弟「dd」を探し、その中のすべてのinputを取得
          let inputElements = await dtAddressElement.findElements(
            By.xpath("following-sibling::dd//input[@type='text']"),
          );
          if (inputElements.length === 0) {
            console.warn('対応するinput要素(住所)が見つかりませんでした。');
            continue;
          }
          // 各input要素に住所を入力
          for (let inputElement of inputElements) {
            const currentValue: string =
              (await inputElement.getAttribute('value')) || '';
            if (!currentValue.trim()) {
              // 入力欄が空の場合だけ入力
              let prefectureData = '';
              if (inquiryData.prefecture === '東京') {
                prefectureData = inquiryData.prefecture + '都';
              } else if (
                inquiryData.prefecture === '大阪' ||
                inquiryData.prefecture === '京都'
              ) {
                prefectureData = inquiryData.prefecture + '府';
              } else if (inquiryData.prefecture === '北海道') {
                prefectureData = inquiryData.prefecture;
              } else {
                prefectureData = inquiryData.prefecture + '県';
              }
              await inputElement.sendKeys(
                prefectureData +
                  inquiryData.city +
                  inquiryData.streetAddress +
                  inquiryData.buildingName,
              );
              console.log(
                prefectureData +
                  inquiryData.city +
                  inquiryData.streetAddress +
                  inquiryData.buildingName,
                'を入力しました。',
              );
            }
          }
        } catch (innerErr) {
          console.error('住所の処理中にエラーが発生しました:', innerErr);
        }
      }
    } else {
      console.log('「住所」というテキストを含むdtタグが見つかりませんでした。');
    }
  }

  /**
   * dlタグ内に部署を入れる処理
   *
   * @param driver - Selenium WebDriverのインスタンス
   * @param inquiryData - お問い合わせ情報
   */
  async handleDepartmentInputDefinitionListElements(
    driver: WebDriver,
    inquiryData: { [key: string]: string },
  ): Promise<void> {
    // テキストが「部署」を含む要素を探す
    let DepartmentElements = await driver.findElements(
      By.xpath("//dt[contains(., '部署')]"),
    );
    if (DepartmentElements.length !== 0) {
      // 部署入力処理
      for (let DepartmentElement of DepartmentElements) {
        try {
          // Xpathで兄弟要素を探し、その中のすべてのinputを取得
          let inputElements = await DepartmentElement.findElements(
            By.xpath("following-sibling::dd//input[@type='text']"),
          );
          for (let inputElement of inputElements) {
            const currentValue: string =
              (await inputElement.getAttribute('value')) || '';
            if (!currentValue.trim()) {
              await inputElement.sendKeys(inquiryData.department);
              console.log(inquiryData.department, 'を入力しました。');
            }
          }
        } catch (innerErr) {
          console.error('部署の処理中にエラーが発生しました:', innerErr);
        }
      }
    } else {
      console.log('「部署」というテキストを含むdtタグが見つかりませんでした。');
    }
  }

  /**
   * dlタグ内に会社名を入れる処理
   *
   * @param driver - Selenium WebDriverのインスタンス
   * @param inquiryData - お問い合わせ情報
   */
  async handleCorporateNameInputDefinitionListElements(
    driver: WebDriver,
    inquiryData: { [key: string]: string },
  ): Promise<void> {
    // テキストが「会社名、御社名、貴社名」を含む要素を探す
    let CorporateNameElements = await driver.findElements(
      By.xpath(
        "//dt[contains(., '会社名')or contains(., '御社名')or contains(., '貴社名')]",
      ),
    );
    if (CorporateNameElements.length !== 0) {
      // 会社名、御社名、貴社名入力処理
      for (let CorporateNameElement of CorporateNameElements) {
        try {
          // Xpathで兄弟要素を探し、その中のすべてのinputを取得
          let inputElements = await CorporateNameElement.findElements(
            By.xpath("following-sibling::dd//input[@type='text']"),
          );
          for (let inputElement of inputElements) {
            const currentValue: string =
              (await inputElement.getAttribute('value')) || '';
            if (!currentValue.trim()) {
              await inputElement.sendKeys(inquiryData.corporateName);
              console.log(inquiryData.corporateName, 'を入力しました。');
            }
          }
        } catch (innerErr) {
          console.error(
            '会社名、御社名、貴社名の処理中にエラーが発生しました:',
            innerErr,
          );
        }
      }
    } else {
      console.log(
        '「会社名、御社名、貴社名」というテキストを含むdtタグが見つかりませんでした。',
      );
    }
  }

  /**
   * Placeholder属性を確認して名前を入れる処理
   *
   * @param driver - Selenium WebDriverのインスタンス
   * @param inquiryData - お問い合わせ情報
   */
  async handleInputPlaceholderElements(
    driver: WebDriver,
    inquiryData: { [key: string]: string },
  ): Promise<void> {
    // すべての<input>要素を取得
    let inputElements = await driver.findElements(By.tagName('input'));

    console.log(`見つかった<input>要素の数: ${inputElements.length}`);

    // 各<input>要素のplaceholder属性を取得してコンソールに出力
    for (let i = 0; i < inputElements.length; i++) {
      let inputElement = inputElements[i];
      let name = await inputElement.getAttribute('name'); // name属性を取得（オプション）
      let placeholder = await inputElement.getAttribute('placeholder');

      console.log(`要素名: ${name}, Placeholderの値: ${placeholder || 'なし'}`);

      // 要素が表示されているか確認
      const isDisplayed = await inputElement.isDisplayed();
      // 要素が有効か確認
      const isEnabled = await inputElement.isEnabled();

      if (!isDisplayed || !isEnabled) {
        console.log(`要素 ${name} は表示されていないか、無効化されています。スキップします。`);
        continue; // 次の要素にスキップ
      }

      const currentValue: string =
        (await inputElement.getAttribute('value')) || '';
      // 名前(漢字)入力
      if (placeholder.includes('山田 太郎')) {
        if (!currentValue.trim()) {
          await inputElement.sendKeys(
            inquiryData.lastName + inquiryData.firstName,
          );
          console.log(
            inquiryData.lastName + inquiryData.firstName,
            'を入力しました。',
          );
        }
      } else if (placeholder.includes('山田')) {
        if (!currentValue.trim()) {
          await inputElement.sendKeys(inquiryData.lastName);
          console.log(inquiryData.lastName, 'を入力しました。');
        }
      } else if (placeholder.includes('太郎')) {
        if (!currentValue.trim()) {
          await inputElement.sendKeys(inquiryData.firstName);
          console.log(inquiryData.firstName, 'を入力しました。');
        }
      }
      // 名前(カナ)入力
      if (placeholder.includes('ヤマダ タロウ')) {
        if (!currentValue.trim()) {
          await inputElement.sendKeys(
            inquiryData.lastNameKatakana + inquiryData.firstNameKatakana,
          );
          console.log(
            inquiryData.lastNameKatakana + inquiryData.firstNameKatakana,
            'を入力しました。',
          );
        }
      } else if (
        placeholder.includes('ヤマダ')
      ) {
        if (!currentValue.trim()) {
          await inputElement.sendKeys(inquiryData.lastNameKatakana);
          console.log(inquiryData.lastNameKatakana, 'を入力しました。');
        }
      } else if (
        placeholder.includes('タロウ')
      ) {
        if (!currentValue.trim()) {
          await inputElement.sendKeys(inquiryData.firstNameKatakana);
          console.log(inquiryData.firstNameKatakana, 'を入力しました。');
        }
      }
      // 名前(かな)入力
      if (placeholder.includes('やまだ たろう')) {
        if (!currentValue.trim()) {
          await inputElement.sendKeys(
            inquiryData.lastNameHiragana + inquiryData.firstNameHiragana,
          );
          console.log(
            inquiryData.lastNameHiragana + inquiryData.firstNameHiragana,
            'を入力しました。',
          );
        }
      } else if (
        placeholder.includes('やまだ')
      ) {
        if (!currentValue.trim()) {
          await inputElement.sendKeys(inquiryData.lastNameHiragana);
          console.log(inquiryData.lastNameHiragana, 'を入力しました。');
        }
      } else if (
        placeholder.includes('たろう')
      ) {
        if (!currentValue.trim()) {
          await inputElement.sendKeys(inquiryData.fifirstNameHiraganastName);
          console.log(
            inquiryData.fifirstNameHiraganastName,
            'を入力しました。',
          );
        }
      }

      // 会社名
      if (placeholder.includes('会社名')) {
        if (!currentValue.trim()) {
          await inputElement.sendKeys(inquiryData.corporateName);
          console.log(inquiryData.corporateName, 'を入力しました。');
        }
      } else if (placeholder.includes('御社名')) {
        if (!currentValue.trim()) {
          await inputElement.sendKeys(inquiryData.corporateName);
          console.log(inquiryData.corporateName, 'を入力しました。');
        }
      } else if (placeholder.includes('貴社名')) {
        if (!currentValue.trim()) {
          await inputElement.sendKeys(inquiryData.corporateName);
          console.log(inquiryData.corporateName, 'を入力しました。');
        }
      }

      // 会社名
      if (placeholder.includes('123-4567')) {
        if (!currentValue.trim()) {
          await inputElement.sendKeys(inquiryData.postalCode);
          console.log(inquiryData.postalCode, 'を入力しました。');
        }
      } 
    }
  }

  /**
   * メールアドレスを入力する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'email_addresses'を含むデータ
   * @param iframes - iframe要素の配列
   * @param emailAddress - メールアドレス
   */
  async inputEmailAddresses(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    emailAddress: string,
  ): Promise<void> {
    for (const emailItem of categorizedData.email_addresses) {
      if (emailItem.element_type === 'Input') {
        // iframe内のメールアドレス入力フィールドを特定して入力を試みる
        if (emailItem.element_type.includes('in iframe')) {
          for (const iframe of iframes) {
            await driver.switchTo().frame(iframe);
            try {
              const emailElement = await driver.wait(
                until.elementLocated(By.name(emailItem.element_name)),
                3000,
              );
              console.log('emailElement', emailElement);
              // フィールドが空かどうかをチェック
              const value = await emailElement.getAttribute('value');
              if (!value) {
                await emailElement.sendKeys(emailAddress); // ★
                console.log(
                  `Email input successful for ${emailItem.element_name} in iframe.`,
                );
              } else {
                console.log(
                  `Email input skipped for ${emailItem.element_name} in iframe (already filled).`,
                );
              }
              break;
            } catch (e) {
              console.log(`Failed to input email in this iframe: ${e}`);
            } finally {
              await driver.switchTo().defaultContent();
            }
          }
        } else {
          try {
            const emailElement = await driver.wait(
              until.elementLocated(By.name(emailItem.element_name)),
              3000,
            );
            // フィールドが空かどうかをチェック
            const value = await emailElement.getAttribute('value');
            if (!value) {
              await emailElement.sendKeys(emailAddress); // ★
              console.log(
                `Email input successful for ${emailItem.element_name}.`,
              );
            } else {
              console.log(
                `Email input skipped for ${emailItem.element_name} (already filled).`,
              );
            }
          } catch (e) {
            console.log(`Failed to input email: ${e}`);
          }
        }
      }
    }
  }
  /**
   * 電話番号の各部分を入力する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'phone_numbers'を含むデータ
   * @param phoneNumber - 電話番号
   */
  async inputPhoneNumbers(
    driver: WebDriver,
    categorizedData: Categories,
    phoneNumber: string,
  ): Promise<void> {
    if (categorizedData.phone_numbers.length >= 3) {
      try {
        const firstphoneNumber = phoneNumber.slice(0, 3);
        // 1つ目の入力ボックスを取得し、空の場合に「123」を入力
        const phoneNumberElement1 = await driver.wait(
          until.elementLocated(
            By.name(categorizedData.phone_numbers[0].element_name),
          ),
          3000,
        );
        const value1 = await phoneNumberElement1.getAttribute('value');
        if (!value1) {
          await phoneNumberElement1.sendKeys(firstphoneNumber);
          console.log(
            `Phone number first part input successful for ${categorizedData.phone_numbers[0].element_name}.`,
          );
        } else {
          console.log(
            `Phone number first part already filled for ${categorizedData.phone_numbers[0].element_name}.`,
          );
        }

        // 2つ目の入力ボックスを取得し、空の場合に「345」を入力
        const secondphoneNumber = phoneNumber.slice(3, 6);
        const phoneNumberElement2 = await driver.wait(
          until.elementLocated(
            By.name(categorizedData.phone_numbers[1].element_name),
          ),
          3000,
        );
        const value2 = await phoneNumberElement2.getAttribute('value');
        if (!value2) {
          await phoneNumberElement2.sendKeys(secondphoneNumber);
          console.log(
            `Phone number second part input successful for ${categorizedData.phone_numbers[1].element_name}.`,
          );
        } else {
          console.log(
            `Phone number second part already filled for ${categorizedData.phone_numbers[1].element_name}.`,
          );
        }

        // 3つ目の入力ボックスを取得し、空の場合に「7899」を入力
        const lastphoneNumber = phoneNumber.slice(-4);
        const phoneNumberElement3 = await driver.wait(
          until.elementLocated(
            By.name(categorizedData.phone_numbers[2].element_name),
          ),
          3000,
        );
        const value3 = await phoneNumberElement3.getAttribute('value');
        if (!value3) {
          await phoneNumberElement3.sendKeys(lastphoneNumber);
          console.log(
            `Phone number third part input successful for ${categorizedData.phone_numbers[2].element_name}.`,
          );
        } else {
          console.log(
            `Phone number third part already filled for ${categorizedData.phone_numbers[2].element_name}.`,
          );
        }
      } catch (e) {
        console.log(`Failed to input phone number: ${e}`);
      }
    }
  }

  /**
   * 電話番号を入力する関数2
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'phone_numbers'を含むデータ
   * @param phoneNumber - 電話番号
   */
  async inputPhoneNumbers2(
    driver: WebDriver,
    categorizedData: Categories,
    phoneNumber: string,
  ): Promise<void> {
    for (const phoneItem of categorizedData.phone_numbers) {
      if (phoneItem.element_type === 'Input') {
        try {
          const phoneElement = await driver.wait(
            until.elementLocated(By.name(phoneItem.element_name)),
            3000,
          );
          const value = await phoneElement.getAttribute('value');
          if (!value) {
            await phoneElement.sendKeys(phoneNumber);
            console.log(
              `Phone input successful for ${phoneItem.element_name}.`,
            );
          } else {
            console.log(
              `Phone number already filled for ${phoneItem.element_name}.`,
            );
          }
        } catch (e) {
          console.log(`Failed to input phone number: ${e}`);
        }
      }
    }
  }

  /**
   * FAX番号の入力
   *
   * categorized_data に含まれる最初の3つのFAX番号入力フィールドに対して、
   * 既に値が入力されている場合はスキップします。
   *
   * @param driver Selenium WebDriverのインスタンス
   * @param categorized_data カテゴライズされたデータオブジェクト
   * @param fax - FAX
   */
  async inputFaxNumbers(
    driver: WebDriver,
    categorized_data: Categories,
    fax: string,
  ): Promise<void> {
    if (categorized_data.fax_numbers.length >= 3) {
      try {
        // 1つ目の入力ボックスを取得し、空の場合に「123」を入力
        const firstFax = fax.slice(0, 3);
        const faxNumberElement1: WebElement = await driver.wait(
          until.elementLocated(
            By.name(categorized_data.fax_numbers[0].element_name),
          ),
          3000,
        );
        await driver.wait(until.elementIsVisible(faxNumberElement1), 3000);
        const value1: string | null = await faxNumberElement1.getAttribute(
          'value',
        );
        if (!value1) {
          await faxNumberElement1.sendKeys(firstFax);
          console.log(
            `fax number first part input successful for ${categorized_data.fax_numbers[0].element_name}.`,
          );
        } else {
          console.log(
            `fax number first part already filled for ${categorized_data.fax_numbers[0].element_name}.`,
          );
        }

        // 2つ目の入力ボックスを取得し、空の場合に「345」を入力
        const secondFax = fax.slice(3, 6);
        const faxNumberElement2: WebElement = await driver.wait(
          until.elementLocated(
            By.name(categorized_data.fax_numbers[1].element_name),
          ),
          3000,
        );
        await driver.wait(until.elementIsVisible(faxNumberElement2), 3000);
        const value2: string | null = await faxNumberElement2.getAttribute(
          'value',
        );
        if (!value2) {
          await faxNumberElement2.sendKeys(secondFax);
          console.log(
            `fax number second part input successful for ${categorized_data.fax_numbers[1].element_name}.`,
          );
        } else {
          console.log(
            `fax number second part already filled for ${categorized_data.fax_numbers[1].element_name}.`,
          );
        }

        // 3つ目の入力ボックスを取得し、空の場合に「7899」を入力
        const lastFax = fax.slice(-4);
        const faxNumberElement3: WebElement = await driver.wait(
          until.elementLocated(
            By.name(categorized_data.fax_numbers[2].element_name),
          ),
          3000,
        );
        await driver.wait(until.elementIsVisible(faxNumberElement3), 3000);
        const value3: string | null = await faxNumberElement3.getAttribute(
          'value',
        );
        if (!value3) {
          await faxNumberElement3.sendKeys(lastFax);
          console.log(
            `fax number third part input successful for ${categorized_data.fax_numbers[2].element_name}.`,
          );
        } else {
          console.log(
            `fax number third part already filled for ${categorized_data.fax_numbers[2].element_name}.`,
          );
        }
      } catch (e) {
        console.error(`Failed to input fax number: ${e}`);
      }
    } else {
      console.warn('Categorized data does not contain at least 3 fax numbers.');
    }
  }

  /**
   * FAX番号の入力2
   *
   * categorized_data に含まれるすべてのFAX番号入力フィールドに対して、
   * element_type が "Input" の場合に「0123456789」を入力します。既に値が入力されている場合はスキップします。
   *
   * @param driver Selenium WebDriverのインスタンス
   * @param categorized_data カテゴライズされたデータオブジェクト
   * @param fax - FAX
   */
  async inputFaxNumbers2(
    driver: WebDriver,
    categorized_data: Categories,
    fax: string,
  ): Promise<void> {
    for (const faxItem of categorized_data.fax_numbers) {
      if (faxItem.element_type === 'Input') {
        try {
          const faxElement: WebElement = await driver.wait(
            until.elementLocated(By.name(faxItem.element_name)),
            3000,
          );
          await driver.wait(until.elementIsVisible(faxElement), 3000);
          const value: string | null = await faxElement.getAttribute('value');
          if (!value) {
            await faxElement.sendKeys(fax);
            console.log(`fax input successful for ${faxItem.element_name}.`);
          } else {
            console.log(
              `fax number already filled for ${faxItem.element_name}.`,
            );
          }
        } catch (e) {
          console.error(`Failed to input fax number: ${e}`);
        }
      }
    }
  }

  /**
   * 郵便番号の各部分を入力する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'post_code'を含むデータ
   * @param postalCode - 郵便番号
   */
  async inputPostCode(
    driver: WebDriver,
    categorizedData: Categories,
    postalCode: string,
  ): Promise<void> {
    if (categorizedData.post_code.length >= 2) {
      try {
        // 1つ目の入力ボックスを取得し、空の場合に「987」を入力
        const firstpostalCode = postalCode.slice(0, 3);
        const postCodeElement1 = await driver.wait(
          until.elementLocated(
            By.name(categorizedData.post_code[0].element_name),
          ),
          3000,
        );
        const value1 = await postCodeElement1.getAttribute('value');
        if (!value1.trim()) {
          await postCodeElement1.sendKeys(firstpostalCode);
          console.log(
            `Post_code first part input successful for ${categorizedData.post_code[0].element_name}.`,
          );
        } else {
          console.log(
            `Post_code first part already filled for ${categorizedData.post_code[0].element_name}.`,
          );
        }

        // 2つ目の入力ボックスを取得し、空の場合に「6543」を入力
        const secondpostalCode = postalCode.slice(3, 7);
        const postCodeElement2 = await driver.wait(
          until.elementLocated(
            By.name(categorizedData.post_code[1].element_name),
          ),
          3000,
        );
        const value2 = await postCodeElement2.getAttribute('value');
        if (!value2.trim()) {
          await postCodeElement2.sendKeys(secondpostalCode);
          console.log(
            `Post_code second part input successful for ${categorizedData.post_code[1].element_name}.`,
          );
        } else {
          console.log(
            `Post_code second part already filled for ${categorizedData.post_code[1].element_name}.`,
          );
        }
      } catch (e) {
        console.log(`Failed to input post_code number: ${e}`);
      }
    }
  }

  /**
   * 郵便番号を入力する関数2
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'post_code'を含むデータ
   * @param postalCode - 郵便番号
   */
  async inputPostCode2(
    driver: WebDriver,
    categorizedData: Categories,
    postalCode: string,
  ): Promise<void> {
    for (const postCodeItem of categorizedData.post_code) {
      if (postCodeItem.element_type === 'Input') {
        try {
          const postCodeElement = await driver.wait(
            until.elementLocated(By.name(postCodeItem.element_name)),
            3000,
          );
          const value = await postCodeElement.getAttribute('value');
          if (!value) {
            await postCodeElement.sendKeys(postalCode);
            console.log(
              `Post_code input successful for ${postCodeItem.element_name}.`,
            );
          } else {
            console.log(
              `Post_code already filled for ${postCodeItem.element_name}.`,
            );
          }
        } catch (e) {
          console.log(`Failed to input post_code number: ${e}`);
        }
      }
    }
  }

  /**
   * 会社名を入力する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'company_names'を含むデータ
   * @param corporateName - 会社名
   */
  async inputCompanyName(
    driver: WebDriver,
    categorizedData: Categories,
    corporateName: string,
  ): Promise<void> {
    for (const companyItem of categorizedData.company_names) {
      if (companyItem.element_type === 'Input') {
        try {
          const companyElement = await driver.wait(
            until.elementLocated(By.name(companyItem.element_name)),
            3000,
          );
          const value = await companyElement.getAttribute('value');
          if (!value) {
            await companyElement.sendKeys(corporateName);
            console.log(
              `corporateName input successful for ${companyElement.element_name}.`,
            );
          } else {
            console.log(
              `corporateName already filled for ${companyElement.element_name}.`,
            );
          }
          console.log(
            `Company input successful for ${companyItem.element_name}.`,
          );
        } catch (e) {
          console.log(`Failed to input company: ${e}`);
        }
      }
    }
  }
  /**
   * 苗字を入力する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'kanji_sei'を含むデータ
   * @param lastName - 姓
   */
  async inputKanjiSei(
    driver: WebDriver,
    categorizedData: Categories,
    lastName: string,
  ): Promise<void> {
    for (const kanjiSeiItem of categorizedData.kanji_sei) {
      if (kanjiSeiItem.element_type === 'Input') {
        try {
          const kanjiSeiElement = await driver.wait(
            until.elementLocated(By.name(kanjiSeiItem.element_name)),
            3000,
          );
          const value = await kanjiSeiElement.getAttribute('value');
          if (value === '') {
            await kanjiSeiElement.sendKeys(lastName);
            console.log(
              `kanji_sei input successful for ${kanjiSeiItem.element_name}.`,
            );
          } else {
            console.log(
              `kanji_sei field already has value for ${kanjiSeiItem.element_name}.`,
            );
          }
        } catch (e) {
          console.log(`Failed to input kanji_sei: ${e}`);
        }
      }
    }
  }

  /**
   * 名前を入力する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'kanji_mei'を含むデータ
   * @param firstName - 名
   */
  async inputKanjiMei(
    driver: WebDriver,
    categorizedData: Categories,
    firstName: string,
  ): Promise<void> {
    for (const kanjiMeiItem of categorizedData.kanji_mei) {
      if (kanjiMeiItem.element_type === 'Input') {
        try {
          const kanjiMeiElement = await driver.wait(
            until.elementLocated(By.name(kanjiMeiItem.element_name)),
            3000,
          );
          const value = await kanjiMeiElement.getAttribute('value');
          if (value === '') {
            await kanjiMeiElement.sendKeys(firstName);
            console.log(
              `kanji_mei input successful for ${kanjiMeiItem.element_name}.`,
            );
          } else {
            console.log(
              `kanji_mei field already has value for ${kanjiMeiItem.element_name}.`,
            );
          }
        } catch (e) {
          console.log(`Failed to input kanji_mei: ${e}`);
        }
      }
    }
  }

  /**
   * フルネームを入力する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'kanji_fullname'を含むデータ
   * @param lastName - 姓
   * @param firstName - 名
   */
  async inputKanjiFullname(
    driver: WebDriver,
    categorizedData: Categories,
    lastName: string,
    firstName: string,
  ): Promise<void> {
    for (const kanjiFullnameItem of categorizedData.kanji_fullname) {
      if (kanjiFullnameItem.element_type === 'Input') {
        try {
          const kanjiFullnameElement = await driver.wait(
            until.elementLocated(By.name(kanjiFullnameItem.element_name)),
            3000,
          );
          const value = await kanjiFullnameElement.getAttribute('value');
          if (value === '') {
            await kanjiFullnameElement.sendKeys(lastName + firstName);
            console.log(
              `kanji_fullname input successful for ${kanjiFullnameItem.element_name}.`,
            );
          } else {
            console.log(
              `kanji_fullname field already has value for ${kanjiFullnameItem.element_name}.`,
            );
          }
        } catch (e) {
          console.log(`Failed to input kanji_fullname: ${e}`);
        }
      }
    }
  }

  /**
   * カタカナ苗字を入力する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'katakana_sei'を含むデータ
   * @param lastNameKatakana - セイ
   */
  async inputKatakanaSei(
    driver: WebDriver,
    categorizedData: Categories,
    lastNameKatakana: string,
  ): Promise<void> {
    for (const katakanaSeiItem of categorizedData.katakana_sei) {
      if (katakanaSeiItem.element_type === 'Input') {
        try {
          const katakanaSeiElement = await driver.wait(
            until.elementLocated(By.name(katakanaSeiItem.element_name)),
            3000,
          );
          const value = await katakanaSeiElement.getAttribute('value');
          if (value === '') {
            await katakanaSeiElement.sendKeys(lastNameKatakana);
            console.log(
              `katakana_sei input successful for ${katakanaSeiItem.element_name}.`,
            );
          } else {
            console.log(
              `katakana_sei field already has value for ${katakanaSeiItem.element_name}.`,
            );
          }
        } catch (e) {
          console.log(`Failed to input katakana_sei: ${e}`);
        }
      }
    }
  }

  /**
   * カタカナ名を入力する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'katakana_mei'を含むデータ
   * @param firstNameKatakana - メイ
   */
  async inputKatakanaMei(
    driver: WebDriver,
    categorizedData: Categories,
    firstNameKatakana: string,
  ): Promise<void> {
    for (const katakanaMeiItem of categorizedData.katakana_mei) {
      if (katakanaMeiItem.element_type === 'Input') {
        try {
          const katakanaMeiElement = await driver.wait(
            until.elementLocated(By.name(katakanaMeiItem.element_name)),
            3000,
          );
          const value = await katakanaMeiElement.getAttribute('value');
          if (value === '') {
            await katakanaMeiElement.sendKeys(firstNameKatakana);
            console.log(
              `katakana_mei input successful for ${katakanaMeiItem.element_name}.`,
            );
          } else {
            console.log(
              `katakana_mei field already has value for ${katakanaMeiItem.element_name}.`,
            );
          }
        } catch (e) {
          console.log(`Failed to input katakana_mei: ${e}`);
        }
      }
    }
  }

  /**
   * カタカナフルネームを入力する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'katakana_fullname'を含むデータ
   * @param lastNameKatakana - セイ
   * @param firstNameKatakana - メイ
   */
  async inputKatakanaFullname(
    driver: WebDriver,
    categorizedData: Categories,
    lastNameKatakana: string,
    firstNameKatakana: string,
  ): Promise<void> {
    for (const katakanaFullnameItem of categorizedData.katakana_fullname) {
      if (katakanaFullnameItem.element_type === 'Input') {
        try {
          const katakanaFullnameElement = await driver.wait(
            until.elementLocated(By.name(katakanaFullnameItem.element_name)),
            3000,
          );
          const value = await katakanaFullnameElement.getAttribute('value');
          if (value === '') {
            await katakanaFullnameElement.sendKeys(
              lastNameKatakana + firstNameKatakana,
            );
            console.log(
              `katakana_fullname input successful for ${katakanaFullnameItem.element_name}.`,
            );
          } else {
            console.log(
              `katakana_fullname field already has value for ${katakanaFullnameItem.element_name}.`,
            );
          }
        } catch (e) {
          console.log(`Failed to input katakana_fullname: ${e}`);
        }
      }
    }
  }

  /**
   * ひらがな苗字を入力する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'hiragana_sei'を含むデータ
   * @param lastNameHiragana - せい
   */
  async inputHiraganaSei(
    driver: WebDriver,
    categorizedData: Categories,
    lastNameHiragana: string,
  ): Promise<void> {
    for (const hiraganaSeiItem of categorizedData.hiragana_sei) {
      if (hiraganaSeiItem.element_type === 'Input') {
        try {
          const hiraganaSeiElement = await driver.wait(
            until.elementLocated(By.name(hiraganaSeiItem.element_name)),
            3000,
          );
          const value = await hiraganaSeiElement.getAttribute('value');
          if (value === '') {
            await hiraganaSeiElement.sendKeys(lastNameHiragana);
            console.log(
              `hiragana_sei input successful for ${hiraganaSeiItem.element_name}.`,
            );
          } else {
            console.log(
              `hiragana_sei field already has value for ${hiraganaSeiItem.element_name}.`,
            );
          }
        } catch (e) {
          console.log(`Failed to input hiragana_sei: ${e}`);
        }
      }
    }
  }

  /**
   * ひらがな名を入力する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'hiragana_mei'を含むデータ
   * @param firstNameHiragana - めい
   */
  async inputHiraganaMei(
    driver: WebDriver,
    categorizedData: Categories,
    firstNameHiragana: string,
  ): Promise<void> {
    for (const hiraganaMeiItem of categorizedData.hiragana_mei) {
      if (hiraganaMeiItem.element_type === 'Input') {
        try {
          const hiraganaMeiElement = await driver.wait(
            until.elementLocated(By.name(hiraganaMeiItem.element_name)),
            3000,
          );
          const value = await hiraganaMeiElement.getAttribute('value');
          if (value === '') {
            await hiraganaMeiElement.sendKeys(firstNameHiragana);
            console.log(
              `hiragana_mei input successful for ${hiraganaMeiItem.element_name}.`,
            );
          } else {
            console.log(
              `hiragana_mei field already has value for ${hiraganaMeiItem.element_name}.`,
            );
          }
        } catch (e) {
          console.log(`Failed to input hiragana_mei: ${e}`);
        }
      }
    }
  }

  /**
   * ひらがなフルネームを入力する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'hiragana_fullname'を含むデータ
   * @param lastNameHiragana - せい
   * @param firstNameHiragana - めい
   */
  async inputHiraganaFullname(
    driver: WebDriver,
    categorizedData: Categories,
    lastNameHiragana: string,
    firstNameHiragana: string,
  ): Promise<void> {
    for (const hiraganaFullnameItem of categorizedData.hiragana_fullname) {
      if (hiraganaFullnameItem.element_type === 'Input') {
        try {
          const hiraganaFullnameElement = await driver.wait(
            until.elementLocated(By.name(hiraganaFullnameItem.element_name)),
            3000,
          );
          const value = await hiraganaFullnameElement.getAttribute('value');
          if (value === '') {
            await hiraganaFullnameElement.sendKeys(
              lastNameHiragana + firstNameHiragana,
            );
            console.log(
              `hiragana_fullname input successful for ${hiraganaFullnameItem.element_name}.`,
            );
          } else {
            console.log(
              `hiragana_fullname field already has value for ${hiraganaFullnameItem.element_name}.`,
            );
          }
        } catch (e) {
          console.log(`Failed to input hiragana_fullname: ${e}`);
        }
      }
    }
  }
  /**
   * 部署を入力する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'departments'を含むデータ
   * @param department - 部署
   */
  async inputDepartments(
    driver: WebDriver,
    categorizedData: Categories,
    department: string,
  ): Promise<void> {
    for (const departmentsItem of categorizedData.departments) {
      if (departmentsItem.element_type === 'Input') {
        try {
          const departmentsElement = await driver.wait(
            until.elementLocated(By.name(departmentsItem.element_name)),
            3000,
          );
          const value = await departmentsElement.getAttribute('value');
          if (value === '') {
            await departmentsElement.sendKeys(department);
            console.log(
              `departments input successful for ${departmentsItem.element_name}.`,
            );
          } else {
            console.log(
              `departments input successful for ${departmentsItem.element_name}.`,
            );
          }
        } catch (e) {
          console.log(`Failed to input departments: ${e}`);
        }
      }
    }
  }

  /**
   * 導入時期を入力する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'introduction_time'を含むデータ
   */
  async inputIntroductionTime(
    driver: WebDriver,
    categorizedData: Categories,
  ): Promise<void> {
    for (const introductionTimeItem of categorizedData.introduction_time) {
      if (introductionTimeItem.element_type === 'Input') {
        try {
          const introductionTimeElement = await driver.wait(
            until.elementLocated(By.name(introductionTimeItem.element_name)),
            3000,
          );
          const value = await introductionTimeElement.getAttribute('value');
          if (value === '') {
            await introductionTimeElement.sendKeys('未定');
            console.log(
              `introduction_time input successful for ${introductionTimeItem.element_name}.`,
            );
          } else {
            console.log(
              `introduction_time input successful for ${introductionTimeItem.element_name}.`,
            );
          }
        } catch (e) {
          console.log(`Failed to input introduction_time: ${e}`);
        }
      }
    }
  }

  /**
   * 部署のプルダウンメニューを処理する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'departments'を含むデータ
   * @param departmentKeywords - 部署のキーワードリスト
   */
  async selectDepartments(
    driver: WebDriver,
    categorizedData: Categories,
    departmentKeywords: string[],
  ): Promise<void> {
    for (const departmentsItem of categorizedData.departments) {
      if (departmentsItem.element_type === 'Select') {
        try {
          const selectElement = await driver.wait(
            until.elementLocated(By.name(departmentsItem.element_name)),
            3000,
          );
          const options = await selectElement.findElements(
            By.tagName('option'),
          );
          let selectedOption: string | null = null;

          for (const keyword of departmentKeywords) {
            for (const option of options) {
              const optionText = await option.getText();
              if (optionText.includes(keyword)) {
                selectedOption = optionText;
                await option.click();
                console.log(`departmentsItem input successful.`);
                break;
              }
            }
            if (selectedOption) {
              break;
            }
          }

          if (!selectedOption) {
            console.log(`No matching keyword found for departmentsItem.`);
          }
        } catch (e) {
          console.log(`Failed to input departments: ${e}`);
        }
      }
    }
  }

  /**
   * 導入時期のプルダウンメニューを処理する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'introduction_time'を含むデータ
   */
  async selectIntroductionTime(
    driver: WebDriver,
    categorizedData: Categories,
  ): Promise<void> {
    for (const introductionTimeItem of categorizedData.introduction_time) {
      if (introductionTimeItem.element_type === 'Select') {
        try {
          const selectElement = await driver.wait(
            until.elementLocated(By.name(introductionTimeItem.element_name)),
            3000,
          );
          const options = await selectElement.findElements(
            By.tagName('option'),
          );
          for (const option of options) {
            const optionText = await option.getText();
            if (
              optionText.includes('検討') ||
              optionText.includes('未定') ||
              optionText.includes('その他') ||
              optionText.includes('情報収集')
            ) {
              await option.click();
              console.log(
                `introduction_time input successful for ${introductionTimeItem.element_name} with option '${optionText}'.`,
              );
              break;
            }
          }
        } catch (e) {
          console.log(`Failed to input introduction_time: ${e}`);
        }
      }
    }
  }

  /**
   * 知ったきっかけを入力する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'how_found'を含むデータ
   */
  async inputHowFound(
    driver: WebDriver,
    categorizedData: Categories,
  ): Promise<void> {
    for (const howFoundItem of categorizedData.how_found) {
      if (howFoundItem.element_type === 'Input') {
        try {
          const howFoundElement = await driver.wait(
            until.elementLocated(By.name(howFoundItem.element_name)),
            3000,
          );
          await howFoundElement.sendKeys('きっかけ');
          console.log(
            `How_found input successful for ${howFoundItem.element_name}.`,
          );
        } catch (e) {
          console.log(`Failed to input how_found: ${e}`);
        }
      }
    }
  }

  /**
   * 知ったきっかけのプルダウンメニューを処理する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'how_found'を含むデータ
   */
  async selectHowFound(
    driver: WebDriver,
    categorizedData: Categories,
  ): Promise<void> {
    for (const howFoundItem of categorizedData.how_found) {
      if (howFoundItem.element_type === 'Select') {
        try {
          const selectElement = await driver.wait(
            until.elementLocated(By.name(howFoundItem.element_name)),
            3000,
          );
          const options = await selectElement.findElements(
            By.tagName('option'),
          );
          for (const option of options) {
            const optionText = await option.getText();
            if (
              optionText.includes('検索') ||
              optionText.includes('その他') ||
              optionText.includes('セールス')
            ) {
              await option.click();
              console.log(
                `How_found input successful for ${howFoundItem.element_name} with option '${optionText}'.`,
              );
              break;
            }
          }
        } catch (e) {
          console.log(`Failed to input how_found: ${e}`);
        }
      }
    }
  }

  /**
   * 役職を入力する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'positions'を含むデータ
   * @param jobPosition - 役職
   */
  async inputPositions(
    driver: WebDriver,
    categorizedData: Categories,
    jobPosition: string,
  ): Promise<void> {
    for (const positionsItem of categorizedData.positions) {
      if (positionsItem.element_type === 'Input') {
        try {
          const positionsElement = await driver.wait(
            until.elementLocated(By.name(positionsItem.element_name)),
            3000,
          );
          const value = await positionsElement.getAttribute('value');
          if (value === '') {
            await positionsElement.sendKeys(jobPosition);
            console.log(
              `positions input successful for ${positionsItem.element_name}.`,
            );
          } else {
            console.log(
              `positions input successful for ${positionsItem.element_name}.`,
            );
          }
        } catch (e) {
          console.log(`Failed to input positions: ${e}`);
        }
      }
    }
  }

  /**
   * 役職のプルダウンメニューを処理する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'positions'を含むデータ
   * @param jobPositionKeywords 役職に対するキーワードリスト
   */
  async selectPositions(
    driver: WebDriver,
    categorizedData: Categories,
    jobPositionKeywords: string[],
  ): Promise<void> {
    for (const positionsItem of categorizedData.positions) {
      if (positionsItem.element_type === 'Select') {
        try {
          const selectElement = await driver.wait(
            until.elementLocated(By.name(positionsItem.element_name)),
            3000,
          );
          const options = await selectElement.findElements(
            By.tagName('option'),
          );

          let selectedOption: string | null = null;

          for (const keyword of jobPositionKeywords) {
            for (const option of options) {
              const optionText = await option.getText();
              if (optionText.includes(keyword)) {
                selectedOption = optionText;
                await option.click();
                console.log(`positionsItem input successful.`);
                break;
              }
            }
            if (selectedOption) {
              break;
            }
          }

          if (!selectedOption) {
            console.log(`No matching keyword found for positionsItem.`);
          }
        } catch (e) {
          console.log(`Failed to input positions: ${e}`);
        }
      }
    }
  }

  /**
   * 業種を入力する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'industry'を含むデータ
   * @param industryType - 'industry'を含むデータ
   */
  async inputIndustry(
    driver: WebDriver,
    categorizedData: Categories,
    industryType: string,
  ): Promise<void> {
    for (const industryItem of categorizedData.industry) {
      if (industryItem.element_type === 'Input') {
        try {
          const industryElement = await driver.wait(
            until.elementLocated(By.name(industryItem.element_name)),
            3000,
          );
          const value = await industryElement.getAttribute('value');
          if (value === '') {
            await industryElement.sendKeys(industryType);
            console.log(
              `industry input successful for ${industryItem.element_name}.`,
            );
          } else {
            console.log(
              `industry input successful for ${industryItem.element_name}.`,
            );
          }
        } catch (e) {
          console.log(`Failed to input industry: ${e}`);
        }
      }
    }
  }

  /**
   * 業種のプルダウンメニューを処理する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'industry'を含むデータ
   * @param industryTypeKeywords - 業種のキーワードリスト
   */
  async selectIndustry(
    driver: WebDriver,
    categorizedData: Categories,
    industryTypeKeywords: string[],
  ): Promise<void> {
    for (const industryItem of categorizedData.industry) {
      if (industryItem.element_type === 'Select') {
        try {
          const selectElement = await driver.wait(
            until.elementLocated(By.name(industryItem.element_name)),
            3000,
          );
          const options = await selectElement.findElements(
            By.tagName('option'),
          );
          let selectedOption: string | null = null;

          for (const keyword of industryTypeKeywords) {
            for (const option of options) {
              const optionText = await option.getText();
              if (optionText.includes(keyword)) {
                selectedOption = optionText;
                await option.click();
                console.log(`industryItem input successful.`);
                break;
              }
            }
            if (selectedOption) {
              break;
            }
          }

          if (!selectedOption) {
            console.log(`No matching keyword found for industryItem.`);
          }
        } catch (e) {
          console.log(`Failed to input industry: ${e}`);
        }
      }
    }
  }

  /**
   * 従業員規模を入力する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'employee_sizes'を含むデータ
   * @param employeeSize - 従業員規模
   */
  async inputEmployeeSizes(
    driver: WebDriver,
    categorizedData: Categories,
    employeeSize: string,
  ): Promise<void> {
    for (const employeeSizesItem of categorizedData.employee_sizes) {
      if (employeeSizesItem.element_type === 'Input') {
        try {
          const employeeSizesElement = await driver.wait(
            until.elementLocated(By.name(employeeSizesItem.element_name)),
            3000,
          );
          await employeeSizesElement.sendKeys(employeeSize);
          console.log(
            `Employee_sizes input successful for ${employeeSizesItem.element_name}.`,
          );
        } catch (e) {
          console.log(`Failed to input employee_sizes: ${e}`);
        }
      }
    }
  }

  /**
   * 従業員規模のプルダウンメニューを処理する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'employee_sizes'を含むデータ
   * @param employeeSize - 従業員規模
   */
  async selectEmployeeSizes(
    driver: WebDriver,
    categorizedData: Categories,
    employeeSizesKeywords: string[],
  ): Promise<void> {
    for (const employeeSizesItem of categorizedData.employee_sizes) {
      if (employeeSizesItem.element_type === 'Select') {
        try {
          const selectElement = await driver.wait(
            until.elementLocated(By.name(employeeSizesItem.element_name)),
            3000,
          );
          const options = await selectElement.findElements(
            By.tagName('option'),
          );
          let selectedOption: string | null = null;

          for (const keyword of employeeSizesKeywords) {
            for (const option of options) {
              const optionText = await option.getText();
              if (optionText.includes(keyword)) {
                selectedOption = optionText;
                await option.click();
                console.log(`employeeSizesItem input successful.`);
                break;
              }
            }
            if (selectedOption) {
              break;
            }
          }

          if (!selectedOption) {
            console.log(`No matching keyword found for employeeSizesItem.`);
          }
        } catch (e) {
          console.log(`Failed to input employee_sizes: ${e}`);
        }
      }
    }
  }

  /**
   * URLを入力する関数(入力項目なし)
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'url'を含むデータ
   * @param myCorporateURL - 自社HPのURL
   */
  async inputUrl(
    driver: WebDriver,
    categorizedData: Categories,
    myCorporateURL: string,
  ): Promise<void> {
    for (const urlItem of categorizedData.url) {
      if (urlItem.element_type === 'Input') {
        try {
          const urlElement = await driver.wait(
            until.elementLocated(By.name(urlItem.element_name)),
            3000,
          );
          await urlElement.sendKeys(myCorporateURL);
          console.log(`Url input successful for ${urlItem.element_name}.`);
        } catch (e) {
          console.log(`Failed to input url: ${e}`);
        }
      }
    }
  }

  /**
   * お問い合わせ件名を入力する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'inquiry_genre'を含むデータ
   * @param inquirySubject - お問い合わせ件名
   */
  async inputInquiryGenre(
    driver: WebDriver,
    categorizedData: Categories,
    inquirySubject: string,
  ): Promise<void> {
    for (const inquiryGenreItem of categorizedData.inquiry_genre) {
      if (inquiryGenreItem.element_type === 'Input') {
        try {
          const inquiryGenreElement = await driver.wait(
            until.elementLocated(By.name(inquiryGenreItem.element_name)),
            3000,
          );
          await inquiryGenreElement.sendKeys(inquirySubject);
          console.log(
            `Inquiry_genre input successful for ${inquiryGenreItem.element_name}.`,
          );
        } catch (e) {
          console.log(`Failed to input inquiry_genre: ${e}`);
        }
      }
    }
  }

  /**
   * お問い合わせ件名のプルダウンメニューを処理する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'inquiry_genre'を含むデータ
   */
  async selectInquiryGenre(
    driver: WebDriver,
    categorizedData: Categories,
  ): Promise<void> {
    for (const inquiryGenreItem of categorizedData.inquiry_genre) {
      if (inquiryGenreItem.element_type === 'Select') {
        try {
          const selectElement = await driver.wait(
            until.elementLocated(By.name(inquiryGenreItem.element_name)),
            3000,
          );
          const options = await selectElement.findElements(
            By.tagName('option'),
          );
          const priorityKeywords = [
            '営業',
            'ご紹介',
            '提案',
            '協業',
            '提携',
            'その他',
            'ご相談',
            'お問い合わせ',
            '取材',
          ];
          let selectedOption: string | null = null;

          for (const keyword of priorityKeywords) {
            for (const option of options) {
              const optionText = await option.getText();
              if (optionText.includes(keyword)) {
                selectedOption = optionText;
                await option.click();
                console.log(
                  `Inquiry_genre input successful for ${inquiryGenreItem.element_name} with option '${selectedOption}'.`,
                );
                break;
              }
            }
            if (selectedOption) {
              break;
            }
          }

          if (!selectedOption) {
            console.log(
              `No matching keyword found for ${inquiryGenreItem.element_name}.`,
            );
          }
        } catch (e) {
          console.log(`Failed to input inquiry_genre: ${e}`);
        }
      }
    }
  }
  /**
   * 住所を入力する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'address'を含むデータ
   * @param prefecture - 都道府県
   * @param city - 市区町村
   * @param streetAddress - 町域・番地
   * @param buildingName - 建物名など
   */
  async inputAddress(
    driver: WebDriver,
    categorizedData: Categories,
    prefecture: string,
    city: string,
    streetAddress: string,
    buildingName: string,
  ): Promise<void> {
    for (const addressItem of categorizedData.address) {
      if (addressItem.element_type === 'Input') {
        try {
          const addressElement = await driver.wait(
            until.elementLocated(By.name(addressItem.element_name)),
            3000,
          );
          const value = await addressElement.getAttribute('value');
          if (!value.trim()) {
            let prefectureData = '';
            if (prefecture === '東京') {
              prefectureData = prefecture + '都';
            } else if (prefecture === '大阪' || prefecture === '京都') {
              prefectureData = prefecture + '府';
            } else if (prefecture === '北海道') {
              prefectureData = prefecture;
            } else {
              prefectureData = prefecture + '県';
            }
            await addressElement.sendKeys(
              prefectureData + city + streetAddress + buildingName,
            );
            console.log(
              `Address input successful for ${addressItem.element_name}.`,
            );
          } else {
            console.log(
              `Address already filled for ${addressItem.element_name}.`,
            );
          }
        } catch (e) {
          console.log(`Failed to input address: ${e}`);
        }
      }
    }
  }

  /**
   * 郵便番号を入力する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'address_zip'を含むデータ
   * @param postalCode - 郵便番号
   */
  async inputAddressZip(
    driver: WebDriver,
    categorizedData: Categories,
    postalCode: string,
  ): Promise<void> {
    for (const addressZipItem of categorizedData.address_zip) {
      if (addressZipItem.element_type === 'Input') {
        try {
          const addressZipElement = await driver.wait(
            until.elementLocated(By.name(addressZipItem.element_name)),
            3000,
          );
          const value = await addressZipElement.getAttribute('value');
          if (!value.trim()) {
            await addressZipElement.sendKeys(postalCode);
            console.log(
              `Address_zip input successful for ${addressZipItem.element_name}.`,
            );
          } else {
            console.log(
              `Address_zip already filled for ${addressZipItem.element_name}.`,
            );
          }
        } catch (e) {
          console.log(`Failed to input address_zip: ${e}`);
        }
      }
    }
  }

  /**
   * 市区町村を入力する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'address_city'を含むデータ
   * @param city - 市区町村
   */
  async inputAddressCity(
    driver: WebDriver,
    categorizedData: Categories,
    city: string,
  ): Promise<void> {
    for (const addressCityItem of categorizedData.address_city) {
      if (addressCityItem.element_type === 'Input') {
        try {
          const addressCityElement = await driver.wait(
            until.elementLocated(By.name(addressCityItem.element_name)),
            3000,
          );
          const value = await addressCityElement.getAttribute('value');
          if (!value.trim()) {
            await addressCityElement.sendKeys(city);
            console.log(
              `Address_city input successful for ${addressCityItem.element_name}.`,
            );
          } else {
            console.log(
              `Address_city already filled for ${addressCityItem.element_name}.`,
            );
          }
        } catch (e) {
          console.log(`Failed to input address_city: ${e}`);
        }
      }
    }
  }

  /**
   * 都道府県を入力する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'address_prefecture'を含むデータ
   * @param prefecture - 都道府県
   */
  async inputAddressPrefecture(
    driver: WebDriver,
    categorizedData: Categories,
    prefecture: string,
  ): Promise<void> {
    for (const addressPrefectureItem of categorizedData.address_prefecture) {
      if (addressPrefectureItem.element_type === 'Input') {
        try {
          const addressPrefectureElement = await driver.wait(
            until.elementLocated(By.name(addressPrefectureItem.element_name)),
            3000,
          );
          const value = await addressPrefectureElement.getAttribute('value');
          if (!value.trim()) {
            let prefectureData = '';
            if (prefecture === '東京') {
              prefectureData = prefecture + '都';
            } else if (prefecture === '大阪' || prefecture === '京都') {
              prefectureData = prefecture + '府';
            } else if (prefecture === '北海道') {
              prefectureData = prefecture;
            } else {
              prefectureData = prefecture + '県';
            }
            await addressPrefectureElement.sendKeys(prefectureData);
            console.log(
              `Address_prefecture input successful for ${addressPrefectureItem.element_name}.`,
            );
          } else {
            console.log(
              `Address_prefecture already filled for ${addressPrefectureItem.element_name}.`,
            );
          }
        } catch (e) {
          console.log(`Failed to input address_prefecture: ${e}`);
        }
      }
    }
  }

  /**
   * 番地を入力する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'address_street'を含むデータ
   * @param streetAddress - 番地
   */
  async inputAddressStreet(
    driver: WebDriver,
    categorizedData: Categories,
    streetAddress: string,
  ): Promise<void> {
    for (const addressStreetItem of categorizedData.address_street) {
      if (addressStreetItem.element_type === 'Input') {
        try {
          const addressStreetElement = await driver.wait(
            until.elementLocated(By.name(addressStreetItem.element_name)),
            3000,
          );
          const value = await addressStreetElement.getAttribute('value');
          if (!value.trim()) {
            await addressStreetElement.sendKeys(streetAddress);
            console.log(
              `Address_street input successful for ${addressStreetItem.element_name}.`,
            );
          } else {
            console.log(
              `Address_street already filled for ${addressStreetItem.element_name}.`,
            );
          }
        } catch (e) {
          console.log(`Failed to input address_street: ${e}`);
        }
      }
    }
  }

  /**
   * 住所のプルダウンメニューを処理する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'address'を含むデータ
   * @param prefecture - 都道府県
   */
  async selectAddress(
    driver: WebDriver,
    categorizedData: Categories,
    prefecture: string,
  ): Promise<void> {
    for (const addressItem of categorizedData.address) {
      if (addressItem.element_type === 'Select') {
        try {
          const selectElement = await driver.wait(
            until.elementLocated(By.name(addressItem.element_name)),
            3000,
          );
          const options = await selectElement.findElements(
            By.tagName('option'),
          );
          for (const option of options) {
            const optionText = await option.getText();
            if (optionText.includes(prefecture)) {
              await option.click();
              console.log(
                `Address input successful for ${addressItem.element_name} with option '${optionText}'.`,
              );
              break;
            }
          }
        } catch (e) {
          console.log(`Failed to input address: ${e}`);
        }
      }
    }
  }

  /**
   * 都道府県のプルダウンメニューを処理する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'address_prefecture'を含むデータ
   * @param prefecture - 都道府県
   */
  async selectAddressPrefecture(
    driver: WebDriver,
    categorizedData: Categories,
    prefecture: string,
  ): Promise<void> {
    for (const addressPrefectureItem of categorizedData.address_prefecture) {
      if (addressPrefectureItem.element_type === 'Select') {
        try {
          const selectElement = await driver.wait(
            until.elementLocated(By.name(addressPrefectureItem.element_name)),
            3000,
          );
          const options = await selectElement.findElements(
            By.tagName('option'),
          );
          for (const option of options) {
            const optionText = await option.getText();
            if (optionText.includes(prefecture)) {
              await option.click();
              console.log(
                `Address_prefecture input successful for ${addressPrefectureItem.element_name} with option '${optionText}'.`,
              );
              break;
            }
          }
        } catch (e) {
          console.log(`Failed to input address_prefecture: ${e}`);
        }
      }
    }
  }

  /**
   * iframe内で会社名を入力する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'company_names'を含むデータ
   * @param iframes - iframe要素の配列
   * @param corporateName - 会社名
   */
  async inputCompanyNameInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    corporateName: string,
  ): Promise<void> {
    for (const companyItem of categorizedData.company_names) {
      if (companyItem.element_type === 'Input in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const companyElement = await driver.wait(
              until.elementLocated(By.name(companyItem.element_name)),
              3000,
            );
            await companyElement.sendKeys(corporateName);
            const index = iframes.indexOf(iframe);
            console.log(
              `Company input successful for ${companyItem.element_name} in iframe ${index}.`,
            );
            break;
          } catch (e) {
            const index = iframes.indexOf(iframe);
            console.log(
              `Failed to input company name in iframe ${index}: ${e}`,
            );
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * iframe内で郵便番号を入力する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'post_code'を含むデータ
   * @param iframes - iframe要素の配列
   * @param postalCode - 郵便番号
   */
  async inputPostCodeInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    postalCode: string,
  ): Promise<void> {
    for (const postCodeItem of categorizedData.post_code) {
      if (postCodeItem.element_type === 'Input in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const firstPostalCode = postalCode.slice(0, 3);
            const postCodeElement1 = await driver.wait(
              until.elementLocated(
                By.name(categorizedData.post_code[0].element_name),
              ),
              3000,
            );
            const value1 = await postCodeElement1.getAttribute('value');
            if (!value1) {
              await postCodeElement1.sendKeys(firstPostalCode);
              const index = iframes.indexOf(iframe);
              console.log(
                `Post_code first part input successful for ${categorizedData.post_code[0].element_name} in iframe ${index}.`,
              );
            } else {
              console.log(
                `Post_code first part already filled for ${
                  categorizedData.post_code[0].element_name
                } in iframe ${iframes.indexOf(iframe)}.`,
              );
            }

            const secondPostalCode = postalCode.slice(3, 7);
            const postCodeElement2 = await driver.wait(
              until.elementLocated(
                By.name(categorizedData.post_code[1].element_name),
              ),
              3000,
            );
            const value2 = await postCodeElement2.getAttribute('value');
            if (!value2) {
              await postCodeElement2.sendKeys(secondPostalCode);
              const index = iframes.indexOf(iframe);
              console.log(
                `Post_code second part input successful for ${categorizedData.post_code[1].element_name} in iframe ${index}.`,
              );
            } else {
              console.log(
                `Post_code second part already filled for ${
                  categorizedData.post_code[1].element_name
                } in iframe ${iframes.indexOf(iframe)}.`,
              );
            }
            break;
          } catch (e) {
            const index = iframes.indexOf(iframe);
            console.log(`Failed to input post_code in iframe ${index}: ${e}`);
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * iframe内で郵便番号を入力する関数2
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'post_code'を含むデータ
   * @param iframes - iframe要素の配列
   * @param postalCode - 郵便番号
   */
  async inputPostCodeInIframe2(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    postalCode: string,
  ): Promise<void> {
    for (const postCodeItem of categorizedData.post_code) {
      if (postCodeItem.element_type === 'Input in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const postCodeElement = await driver.wait(
              until.elementLocated(By.name(postCodeItem.element_name)),
              3000,
            );
            const value = await postCodeElement.getAttribute('value');
            if (!value) {
              await postCodeElement.sendKeys(postalCode);
              const index = iframes.indexOf(iframe);
              console.log(
                `Post_code input successful for ${postCodeItem.element_name} in iframe ${index}.`,
              );
            } else {
              console.log(
                `Post_code already filled for ${
                  postCodeItem.element_name
                } in iframe ${iframes.indexOf(iframe)}.`,
              );
            }
            break;
          } catch (e) {
            const index = iframes.indexOf(iframe);
            console.log(`Failed to input post_code in iframe ${index}: ${e}`);
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * iframe内で苗字を入力する関数
   * @param driver - SeleniumのWebDriverインスタンス
   * @param categorizedData - 'kanji_sei'を含むデータ
   * @param iframes - iframe要素の配列
   * @param lastName - 姓
   */
  async inputKanjiSeiInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    lastName: string,
  ): Promise<void> {
    for (const kanjiSeiItem of categorizedData.kanji_sei) {
      if (kanjiSeiItem.element_type === 'Input in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const kanjiSeiElement = await driver.wait(
              until.elementLocated(By.name(kanjiSeiItem.element_name)),
              3000,
            );
            const value = await kanjiSeiElement.getAttribute('value');
            if (!value) {
              await kanjiSeiElement.sendKeys(lastName);
              const index = iframes.indexOf(iframe);
              console.log(
                `kanji_sei input successful for ${kanjiSeiItem.element_name} in iframe ${index}.`,
              );
            } else {
              console.log(
                `kanji_sei element ${kanjiSeiItem.element_name} already has a value.`,
              );
            }
            break;
          } catch (e) {
            const index = iframes.indexOf(iframe);
            console.log(`Failed to input kanji_sei in iframe ${index}: ${e}`);
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }
  /**
   * iframe内でkanji名の入力処理を行います。
   * @param driver - WebDriverのインスタンス
   * @param categorizedData - カテゴリ別のデータ
   * @param iframes - iframeのリスト
   * @param firstName - 名
   */
  async inputKanjiMeiInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    firstName: string,
  ): Promise<void> {
    for (const kanjiMeiItem of categorizedData.kanji_mei) {
      if (kanjiMeiItem.element_type === 'Input in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const kanjiMeiElement = await driver.wait(
              until.elementLocated(By.name(kanjiMeiItem.element_name)),
              3000,
            );
            const value = await kanjiMeiElement.getAttribute('value');
            if (!value) {
              await kanjiMeiElement.sendKeys(firstName);
              console.log(
                `kanji_mei input successful for ${
                  kanjiMeiItem.element_name
                } in iframe ${iframes.indexOf(iframe)}.`,
              );
            } else {
              console.log(
                `kanji_mei element ${kanjiMeiItem.element_name} already has a value.`,
              );
            }
            break; // 正常に入力できたらループを抜ける
          } catch (e) {
            console.log(
              `Failed to input kanji_mei name in iframe ${iframes.indexOf(
                iframe,
              )}: ${e}`,
            );
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * iframe内でkanjiフルネームの入力処理を行います。
   * @param driver - WebDriverのインスタンス
   * @param categorizedData - カテゴリ別のデータ
   * @param iframes - iframeのリスト
   * @param lastName - 姓
   * @param firstName - 名
   */
  async inputKanjiFullnameInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    lastName: string,
    firstName: string,
  ): Promise<void> {
    for (const kanjiFullnameItem of categorizedData.kanji_fullname) {
      if (kanjiFullnameItem.element_type === 'Input in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const kanjiFullnameElement = await driver.wait(
              until.elementLocated(By.name(kanjiFullnameItem.element_name)),
              3000,
            );
            const value = await kanjiFullnameElement.getAttribute('value');
            if (!value) {
              await kanjiFullnameElement.sendKeys(lastName + firstName);
              console.log(
                `kanji_fullname input successful for ${
                  kanjiFullnameItem.element_name
                } in iframe ${iframes.indexOf(iframe)}.`,
              );
            } else {
              console.log(
                `kanji_fullname input skipped because the field is not empty for ${kanjiFullnameItem.element_name}.`,
              );
            }
            break;
          } catch (e) {
            console.log(
              `Failed to input kanji_fullname name in iframe ${iframes.indexOf(
                iframe,
              )}: ${e}`,
            );
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * iframe内でkatakana姓の入力処理を行います。
   * @param driver - WebDriverのインスタンス
   * @param categorizedData - カテゴリ別のデータ
   * @param iframes - iframeのリスト
   * @param lastNameKatakana - セイ
   */
  async inputKatakanaSeiInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    lastNameKatakana: string,
  ): Promise<void> {
    for (const katakanaSeiItem of categorizedData.katakana_sei) {
      if (katakanaSeiItem.element_type === 'Input in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const katakanaSeiElement = await driver.wait(
              until.elementLocated(By.name(katakanaSeiItem.element_name)),
              3000,
            );
            const value = await katakanaSeiElement.getAttribute('value');
            if (!value) {
              await katakanaSeiElement.sendKeys(lastNameKatakana);
              console.log(
                `katakana_sei input successful for ${
                  katakanaSeiItem.element_name
                } in iframe ${iframes.indexOf(iframe)}.`,
              );
            } else {
              console.log(
                `katakana_sei element ${katakanaSeiItem.element_name} already has a value.`,
              );
            }
            break;
          } catch (e) {
            console.log(
              `Failed to input katakana_sei name in iframe ${iframes.indexOf(
                iframe,
              )}: ${e}`,
            );
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * iframe内でkatakana名の入力処理を行います。
   * @param driver - WebDriverのインスタンス
   * @param categorizedData - カテゴリ別のデータ
   * @param iframes - iframeのリスト
   * @param firstNameKatakana - メイ
   */
  async inputKatakanaMeiInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    firstNameKatakana: string,
  ): Promise<void> {
    for (const katakanaMeiItem of categorizedData.katakana_mei) {
      if (katakanaMeiItem.element_type === 'Input in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const katakanaMeiElement = await driver.wait(
              until.elementLocated(By.name(katakanaMeiItem.element_name)),
              3000,
            );
            const value = await katakanaMeiElement.getAttribute('value');
            if (!value) {
              await katakanaMeiElement.sendKeys(firstNameKatakana);
              console.log(
                `katakana_mei input successful for ${
                  katakanaMeiItem.element_name
                } in iframe ${iframes.indexOf(iframe)}.`,
              );
            } else {
              console.log(
                `katakana_mei element ${katakanaMeiItem.element_name} already has a value.`,
              );
            }
            break;
          } catch (e) {
            console.log(
              `Failed to input katakana_mei name in iframe ${iframes.indexOf(
                iframe,
              )}: ${e}`,
            );
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * iframe内でkatakanaフルネームの入力処理を行います。
   * @param driver - WebDriverのインスタンス
   * @param categorizedData - カテゴリ別のデータ
   * @param iframes - iframeのリスト
   * @param lastNameKatakana - セイ
   * @param firstNameKatakana - メイ
   */
  async inputKatakanaFullnameInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    lastNameKatakana: string,
    firstNameKatakana: string,
  ): Promise<void> {
    for (const katakanaFullnameItem of categorizedData.katakana_fullname) {
      if (katakanaFullnameItem.element_type === 'Input in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const katakanaFullnameElement = await driver.wait(
              until.elementLocated(By.name(katakanaFullnameItem.element_name)),
              3000,
            );
            const value = await katakanaFullnameElement.getAttribute('value');
            if (!value) {
              await katakanaFullnameElement.sendKeys(
                lastNameKatakana + firstNameKatakana,
              );
              console.log(
                `katakana_fullname input successful for ${
                  katakanaFullnameItem.element_name
                } in iframe ${iframes.indexOf(iframe)}.`,
              );
            } else {
              console.log(
                `katakana_fullname input skipped because the field is not empty for ${katakanaFullnameItem.element_name}.`,
              );
            }
            break;
          } catch (e) {
            console.log(
              `Failed to input katakana_fullname name in iframe ${iframes.indexOf(
                iframe,
              )}: ${e}`,
            );
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * iframe内でhiragana姓の入力処理を行います。
   * @param driver - WebDriverのインスタンス
   * @param categorizedData - カテゴリ別のデータ
   * @param iframes - iframeのリスト
   * @param lastNameHiragana - せい
   */
  async inputHiraganaSeiInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    lastNameHiragana: string,
  ): Promise<void> {
    for (const hiraganaSeiItem of categorizedData.hiragana_sei) {
      if (hiraganaSeiItem.element_type === 'Input in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const hiraganaSeiElement = await driver.wait(
              until.elementLocated(By.name(hiraganaSeiItem.element_name)),
              3000,
            );
            const value = await hiraganaSeiElement.getAttribute('value');
            if (!value) {
              await hiraganaSeiElement.sendKeys(lastNameHiragana);
              console.log(
                `hiragana_sei input successful for ${
                  hiraganaSeiItem.element_name
                } in iframe ${iframes.indexOf(iframe)}.`,
              );
            } else {
              console.log(
                `hiragana_sei element ${hiraganaSeiItem.element_name} already has a value.`,
              );
            }
            break;
          } catch (e) {
            console.log(
              `Failed to input hiragana_sei name in iframe ${iframes.indexOf(
                iframe,
              )}: ${e}`,
            );
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * iframe内でhiragana名の入力処理を行います。
   * @param driver - WebDriverのインスタンス
   * @param categorizedData - カテゴリ別のデータ
   * @param iframes - iframeのリスト
   * @param firstNameHiragana - めい
   */
  async inputHiraganaMeiInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    firstNameHiragana: string,
  ): Promise<void> {
    for (const hiraganaMeiItem of categorizedData.hiragana_mei) {
      if (hiraganaMeiItem.element_type === 'Input in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const hiraganaMeiElement = await driver.wait(
              until.elementLocated(By.name(hiraganaMeiItem.element_name)),
              3000,
            );
            const value = await hiraganaMeiElement.getAttribute('value');
            if (!value) {
              await hiraganaMeiElement.sendKeys(firstNameHiragana);
              console.log(
                `hiragana_mei input successful for ${
                  hiraganaMeiItem.element_name
                } in iframe ${iframes.indexOf(iframe)}.`,
              );
            } else {
              console.log(
                `hiragana_mei element ${hiraganaMeiItem.element_name} already has a value.`,
              );
            }
            break;
          } catch (e) {
            console.log(
              `Failed to input hiragana_mei name in iframe ${iframes.indexOf(
                iframe,
              )}: ${e}`,
            );
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * iframe内でhiraganaフルネームの入力処理を行います。
   * @param driver - WebDriverのインスタンス
   * @param categorizedData - カテゴリ別のデータ
   * @param iframes - iframeのリスト
   * @param lastNameHiragana - せい
   * @param firstNameHiragana - めい
   */
  async inputHiraganaFullnameInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    lastNameHiragana: string,
    firstNameHiragana: string,
  ): Promise<void> {
    for (const hiraganaFullnameItem of categorizedData.hiragana_fullname) {
      if (hiraganaFullnameItem.element_type === 'Input in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const hiraganaFullnameElement = await driver.wait(
              until.elementLocated(By.name(hiraganaFullnameItem.element_name)),
              3000,
            );
            const value = await hiraganaFullnameElement.getAttribute('value');
            if (!value) {
              await hiraganaFullnameElement.sendKeys(
                lastNameHiragana + firstNameHiragana,
              );
              console.log(
                `hiragana_fullname input successful for ${
                  hiraganaFullnameItem.element_name
                } in iframe ${iframes.indexOf(iframe)}.`,
              );
            } else {
              console.log(
                `hiragana_fullname input skipped because the field is not empty for ${hiraganaFullnameItem.element_name}.`,
              );
            }
            break;
          } catch (e) {
            console.log(
              `Failed to input hiragana_fullname name in iframe ${iframes.indexOf(
                iframe,
              )}: ${e}`,
            );
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * 部署の入力処理をiframe内で実行します。
   * @param driver Selenium WebDriverのインスタンス
   * @param categorizedData カテゴリ分けされたデータ
   * @param iframes iframe要素の配列
   * @param department 部署
   */
  async inputDepartmentsInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    department: string,
  ): Promise<void> {
    for (const departmentsItem of categorizedData.departments) {
      if (departmentsItem.element_type === 'Input in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const departmentsElement = await driver.wait(
              until.elementLocated(By.name(departmentsItem.element_name)),
              3000,
            );
            await driver.wait(until.elementIsVisible(departmentsElement), 3000);
            await departmentsElement.sendKeys(department);
            console.log(
              `Departments input successful for ${
                departmentsItem.element_name
              } in iframe ${iframes.indexOf(iframe)}.`,
            );
            break;
          } catch (e) {
            console.log(
              `Failed to input departments name in iframe ${iframes.indexOf(
                iframe,
              )}: ${e}`,
            );
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * 部署のプルダウンメニューの入力処理をiframe内で実行します。
   * @param driver Selenium WebDriverのインスタンス
   * @param categorizedData カテゴリ分けされたデータ
   * @param iframes iframe要素の配列
   * @param departmentKeywords - 部署のキーワードリスト
   */
  async selectDepartmentsInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    departmentKeywords: string[],
  ): Promise<void> {
    for (const departmentsItem of categorizedData.departments) {
      if (departmentsItem.element_type === 'Select in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const selectElement = await driver.wait(
              until.elementLocated(By.name(departmentsItem.element_name)),
              3000,
            );
            const options = await selectElement.findElements(
              By.tagName('option'),
            );
            let selectedOption: string | null = null;
            for (const keyword of departmentKeywords) {
              for (const option of options) {
                const optionText = await option.getText();
                if (optionText.includes(keyword)) {
                  selectedOption = optionText;
                  await option.click();
                  console.log(`departmentsItem input successful.`);
                  break;
                }
              }
              if (selectedOption) {
                break;
              }
            }

            if (!selectedOption) {
              console.log(`No matching keyword found for departmentsItem.`);
            }
          } catch (e) {
            console.log(
              `Failed to input departments in iframe ${iframes.indexOf(
                iframe,
              )}: ${e}`,
            );
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * 導入時期の入力処理をiframe内で実行します。
   * @param driver Selenium WebDriverのインスタンス
   * @param categorizedData カテゴリ分けされたデータ
   * @param iframes iframe要素の配列
   */
  async inputIntroductionTimeInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
  ): Promise<void> {
    for (const introductionTimeItem of categorizedData.introduction_time) {
      if (introductionTimeItem.element_type === 'Input in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const introductionTimeElement = await driver.wait(
              until.elementLocated(By.name(introductionTimeItem.element_name)),
              3000,
            );
            await driver.wait(
              until.elementIsVisible(introductionTimeElement),
              3000,
            );
            await introductionTimeElement.sendKeys('検討中');
            console.log(
              `introduction_time input successful for ${
                introductionTimeItem.element_name
              } in iframe ${iframes.indexOf(iframe)}.`,
            );
            break;
          } catch (e) {
            console.log(
              `Failed to input introduction_time name in iframe ${iframes.indexOf(
                iframe,
              )}: ${e}`,
            );
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * 導入時期のプルダウンメニューの入力処理をiframe内で実行します。
   * @param driver Selenium WebDriverのインスタンス
   * @param categorizedData カテゴリ分けされたデータ
   * @param iframes iframe要素の配列
   */
  async selectIntroductionTimeInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
  ): Promise<void> {
    for (const introductionTimeItem of categorizedData.introduction_time) {
      if (introductionTimeItem.element_type === 'Select in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const selectElement = await driver.wait(
              until.elementLocated(By.name(introductionTimeItem.element_name)),
              3000,
            );
            const options = await selectElement.findElements(
              By.tagName('option'),
            );
            let optionSelected = false;
            for (const option of options) {
              const text = await option.getText();
              if (
                text.includes('検討') ||
                text.includes('未定') ||
                text.includes('その他') ||
                text.includes('情報収集')
              ) {
                await option.click();
                console.log(
                  `introduction_time input successful for ${
                    introductionTimeItem.element_name
                  } with option '${text}' in iframe ${iframes.indexOf(
                    iframe,
                  )}.`,
                );
                optionSelected = true;
                break;
              }
            }

            if (!optionSelected) {
              console.log(
                `No suitable option found for ${
                  introductionTimeItem.element_name
                } in iframe ${iframes.indexOf(iframe)}.`,
              );
            }
          } catch (e) {
            console.log(
              `Failed to input introduction_time in iframe ${iframes.indexOf(
                iframe,
              )}: ${e}`,
            );
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * 従業員の入力処理をiframe内で実行します。
   * @param driver Selenium WebDriverのインスタンス
   * @param categorizedData カテゴリ分けされたデータ
   * @param iframes iframe要素の配列
   * @param employeeSize 従業員規模
   */
  async inputEmployeeSizesInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    employeeSize: string,
  ): Promise<void> {
    for (const employeeSizesItem of categorizedData.employee_sizes) {
      if (employeeSizesItem.element_type === 'Input in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const employeeSizesElement = await driver.wait(
              until.elementLocated(By.name(employeeSizesItem.element_name)),
              3000,
            );
            await driver.wait(
              until.elementIsVisible(employeeSizesElement),
              3000,
            );
            await employeeSizesElement.sendKeys(employeeSize);
            console.log(
              `Employee_sizes input successful for ${
                employeeSizesItem.element_name
              } in iframe ${iframes.indexOf(iframe)}.`,
            );
            break;
          } catch (e) {
            console.log(
              `Failed to input employee_sizes name in iframe ${iframes.indexOf(
                iframe,
              )}: ${e}`,
            );
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * 従業員のプルダウンメニューの入力処理をiframe内で実行します。
   * @param driver Selenium WebDriverのインスタンス
   * @param categorizedData カテゴリ分けされたデータ
   * @param iframes iframe要素の配列
   * @param employeeSize 従業員規模
   */
  async selectEmployeeSizesInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    employeeSizesKeywords: string[],
  ): Promise<void> {
    for (const employeeSizesItem of categorizedData.employee_sizes) {
      if (employeeSizesItem.element_type === 'Select in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const selectElement = await driver.wait(
              until.elementLocated(By.name(employeeSizesItem.element_name)),
              3000,
            );
            const options = await selectElement.findElements(
              By.tagName('option'),
            );
            let selectedOption: string | null = null;

            for (const keyword of employeeSizesKeywords) {
              for (const option of options) {
                const optionText = await option.getText();
                if (optionText.includes(keyword)) {
                  selectedOption = optionText;
                  await option.click();
                  console.log(`employeeSizesItem input successful.`);
                  break;
                }
              }
              if (selectedOption) {
                break;
              }
            }

            if (!selectedOption) {
              console.log(
                `No suitable option found for ${
                  employeeSizesItem.element_name
                } in iframe ${iframes.indexOf(iframe)}.`,
              );
            }
          } catch (e) {
            console.log(
              `Failed to input employee_sizes in iframe ${iframes.indexOf(
                iframe,
              )}: ${e}`,
            );
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * URLの入力処理をiframe内で実行します。(入力項目なし)
   * @param driver Selenium WebDriverのインスタンス
   * @param categorizedData カテゴリ分けされたデータ
   * @param iframes iframe要素の配列
   * @param myCorporateURL 自社HPのURL
   */
  async inputUrlInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    myCorporateURL: string,
  ): Promise<void> {
    for (const urlItem of categorizedData.url) {
      if (urlItem.element_type === 'Input in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const urlElement = await driver.wait(
              until.elementLocated(By.name(urlItem.element_name)),
              3000,
            );
            await driver.wait(until.elementIsVisible(urlElement), 3000);
            await urlElement.sendKeys(myCorporateURL);
            console.log(
              `Url input successful for ${
                urlItem.element_name
              } in iframe ${iframes.indexOf(iframe)}.`,
            );
            break;
          } catch (e) {
            console.log(
              `Failed to input url in iframe ${iframes.indexOf(iframe)}: ${e}`,
            );
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * 役職の入力処理をiframe内で実行します。
   * @param driver Selenium WebDriverのインスタンス
   * @param categorizedData カテゴリ分けされたデータ
   * @param iframes iframe要素の配列
   * @param jobPosition 役職
   */
  async inputPositionsInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    jobPosition: string,
  ): Promise<void> {
    for (const positionsItem of categorizedData.positions) {
      if (positionsItem.element_type === 'Input in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const positionsElement = await driver.wait(
              until.elementLocated(By.name(positionsItem.element_name)),
              3000,
            );
            await driver.wait(until.elementIsVisible(positionsElement), 3000);
            await positionsElement.sendKeys(jobPosition);
            console.log(
              `Positions input successful for ${
                positionsItem.element_name
              } in iframe ${iframes.indexOf(iframe)}.`,
            );
            break;
          } catch (e) {
            console.log(
              `Failed to input positions name in iframe ${iframes.indexOf(
                iframe,
              )}: ${e}`,
            );
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * 役職のプルダウンメニューの入力処理をiframe内で実行します。
   * @param driver Selenium WebDriverのインスタンス
   * @param categorizedData カテゴリ分けされたデータ
   * @param iframes iframe要素の配列
   * @param jobPositionKeywords 役職に対するキーワードリスト
   */
  async selectPositionsInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    jobPositionKeywords: string[],
  ): Promise<void> {
    for (const positionsItem of categorizedData.positions) {
      if (positionsItem.element_type === 'Select in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const selectElement = await driver.wait(
              until.elementLocated(By.name(positionsItem.element_name)),
              3000,
            );
            const options = await selectElement.findElements(
              By.tagName('option'),
            );

            let selectedOption: string | null = null;

            for (const keyword of jobPositionKeywords) {
              for (const option of options) {
                const optionText = await option.getText();
                if (optionText.includes(keyword)) {
                  selectedOption = optionText;
                  await option.click();
                  console.log(`positionsItem input successful .`);
                  break;
                }
              }
              if (selectedOption) {
                break;
              }
            }

            if (!selectedOption) {
              console.log(`No matching keyword found for positionsItem.`);
            }
          } catch (e) {
            console.log(
              `Failed to input positions in iframe ${iframes.indexOf(
                iframe,
              )}: ${e}`,
            );
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * 業種の入力処理をiframe内で実行します。
   * @param driver Selenium WebDriverのインスタンス
   * @param categorizedData カテゴリ分けされたデータ
   * @param iframes iframe要素の配列
   * @param industryType 業種
   */
  async inputIndustryInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    industryType: string,
  ): Promise<void> {
    for (const industryItem of categorizedData.industry) {
      if (industryItem.element_type === 'Input in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const industryElement = await driver.wait(
              until.elementLocated(By.name(industryItem.element_name)),
              3000,
            );
            await driver.wait(until.elementIsVisible(industryElement), 3000);
            await industryElement.sendKeys(industryType);
            console.log(
              `Industry input successful for ${
                industryItem.element_name
              } in iframe ${iframes.indexOf(iframe)}.`,
            );
            break;
          } catch (e) {
            console.log(
              `Failed to input industry in iframe ${iframes.indexOf(
                iframe,
              )}: ${e}`,
            );
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * 業種のプルダウンメニューの入力処理をiframe内で実行します。
   * @param driver Selenium WebDriverのインスタンス
   * @param categorizedData カテゴリ分けされたデータ
   * @param iframes iframe要素の配列
   * @param industryTypeKeywords - 業種のキーワードリスト
   */
  async selectIndustryInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    industryTypeKeywords: string[],
  ): Promise<void> {
    for (const industryItem of categorizedData.industry) {
      if (industryItem.element_type === 'Select in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const selectElement = await driver.wait(
              until.elementLocated(By.name(industryItem.element_name)),
              3000,
            );
            const options = await selectElement.findElements(
              By.tagName('option'),
            );
            let selectedOption: string | null = null;

            for (const keyword of industryTypeKeywords) {
              for (const option of options) {
                const optionText = await option.getText();
                if (optionText.includes(keyword)) {
                  selectedOption = optionText;
                  await option.click();
                  console.log(`industryItem input successful .`);
                  break;
                }
              }
              if (selectedOption) {
                break;
              }
            }

            if (!selectedOption) {
              console.log(`No matching keyword found for industryItem.`);
            }
          } catch (e) {
            console.log(
              `Failed to input industry in iframe ${iframes.indexOf(
                iframe,
              )}: ${e}`,
            );
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * 知ったきっかけの入力処理をiframe内で実行します。
   * @param driver Selenium WebDriverのインスタンス
   * @param categorizedData カテゴリ分けされたデータ
   * @param iframes iframe要素の配列
   */
  async inputHowFoundInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
  ): Promise<void> {
    for (const howFoundItem of categorizedData.how_found) {
      if (howFoundItem.element_type === 'Input in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const howFoundElement = await driver.wait(
              until.elementLocated(By.name(howFoundItem.element_name)),
              3000,
            );
            await driver.wait(until.elementIsVisible(howFoundElement), 3000);
            await howFoundElement.sendKeys('検索');
            console.log(
              `How_found input successful for ${
                howFoundItem.element_name
              } in iframe ${iframes.indexOf(iframe)}.`,
            );
            break;
          } catch (e) {
            console.log(
              `Failed to input how_found in iframe ${iframes.indexOf(
                iframe,
              )}: ${e}`,
            );
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * 知ったきっかけのプルダウンメニューの入力処理をiframe内で実行します。
   * @param driver Selenium WebDriverのインスタンス
   * @param categorizedData カテゴリ分けされたデータ
   * @param iframes iframe要素の配列
   */
  async selectHowFoundInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
  ): Promise<void> {
    for (const howFoundItem of categorizedData.how_found) {
      if (howFoundItem.element_type === 'Select in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const selectElement = await driver.wait(
              until.elementLocated(By.name(howFoundItem.element_name)),
              3000,
            );
            const options = await selectElement.findElements(
              By.tagName('option'),
            );

            // キーワードの優先順位リスト
            const priorityKeywords = [
              '営業',
              'ご紹介',
              '提案',
              '協業',
              '提携',
              'その他',
              'ご相談',
              'お問い合わせ',
              '取材',
            ];
            let selectedOption: string | null = null;

            // プルダウンメニューから選択
            for (const keyword of priorityKeywords) {
              for (const option of options) {
                const text = await option.getText();
                if (text.includes(keyword)) {
                  selectedOption = text;
                  break;
                }
              }
              if (selectedOption) {
                break;
              }
            }

            if (selectedOption) {
              await selectElement
                .findElement(By.xpath(`//option[text()="${selectedOption}"]`))
                .click();
              console.log(
                `How_found input successful for ${
                  howFoundItem.element_name
                } with option '${selectedOption}' in iframe ${iframes.indexOf(
                  iframe,
                )}.`,
              );
            } else {
              console.log(
                `No suitable option found for ${
                  howFoundItem.element_name
                } in iframe ${iframes.indexOf(iframe)}.`,
              );
            }
          } catch (e) {
            console.log(
              `Failed to input how_found in iframe ${iframes.indexOf(
                iframe,
              )}: ${e}`,
            );
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * お問い合わせ件名の入力処理をiframe内で実行します。
   * @param driver Selenium WebDriverのインスタンス
   * @param categorizedData カテゴリ分けされたデータ
   * @param iframes iframe要素の配列
   * @param inquirySubject お問い合わせ件名
   */
  async inputInquiryGenreInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    inquirySubject: string,
  ): Promise<void> {
    for (const inquiryGenreItem of categorizedData.inquiry_genre) {
      if (inquiryGenreItem.element_type === 'Input in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const inquiryGenreElement = await driver.wait(
              until.elementLocated(By.name(inquiryGenreItem.element_name)),
              3000,
            );
            await driver.wait(
              until.elementIsVisible(inquiryGenreElement),
              3000,
            );
            await inquiryGenreElement.sendKeys(inquirySubject);
            console.log(
              `Inquiry_genre input successful for ${
                inquiryGenreItem.element_name
              } in iframe ${iframes.indexOf(iframe)}.`,
            );
            break;
          } catch (e) {
            console.log(
              `Failed to input inquiry_genre in iframe ${iframes.indexOf(
                iframe,
              )}: ${e}`,
            );
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * お問い合わせ件名のプルダウンメニューの入力処理をiframe内で実行します。
   * @param driver Selenium WebDriverのインスタンス
   * @param categorizedData カテゴリ分けされたデータ
   * @param iframes iframe要素の配列
   */
  async selectInquiryGenreInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
  ): Promise<void> {
    for (const inquiryGenreItem of categorizedData.inquiry_genre) {
      if (inquiryGenreItem.element_type === 'Select in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const selectElement = await driver.wait(
              until.elementLocated(By.name(inquiryGenreItem.element_name)),
              3000,
            );
            const selectObj = await selectElement.findElements(
              By.tagName('option'),
            );

            // キーワードの優先順位リスト
            const priorityKeywords = [
              '営業',
              'ご紹介',
              '提案',
              '協業',
              '提携',
              'その他',
              'ご相談',
              'お問い合わせ',
              '取材',
            ];
            let selectedOption: string | null = null;

            // プルダウンメニューから選択
            for (const keyword of priorityKeywords) {
              for (const option of selectObj) {
                const text = await option.getText();
                if (text.includes(keyword)) {
                  selectedOption = text;
                  break;
                }
              }
              if (selectedOption) {
                break;
              }
            }

            if (selectedOption) {
              await selectElement
                .findElement(By.xpath(`//option[text()="${selectedOption}"]`))
                .click();
              console.log(
                `Inquiry_genre input successful for ${
                  inquiryGenreItem.element_name
                } with option '${selectedOption}' in iframe ${iframes.indexOf(
                  iframe,
                )}.`,
              );
            } else {
              console.log(
                `No suitable option found for ${
                  inquiryGenreItem.element_name
                } in iframe ${iframes.indexOf(iframe)}.`,
              );
            }
          } catch (e) {
            console.log(
              `Failed to input inquiry_genre in iframe ${iframes.indexOf(
                iframe,
              )}: ${e}`,
            );
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * 住所の入力処理をiframe内で実行します。
   * @param driver Selenium WebDriverのインスタンス
   * @param categorizedData カテゴリ分けされたデータ
   * @param iframes iframe要素の配列
   * @param prefecture - 都道府県
   * @param city - 市区町村
   * @param streetAddress - 町域・番地
   * @param buildingName - 建物名など
   */
  async inputAddressInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    prefecture: string,
    city: string,
    streetAddress: string,
    buildingName: string,
  ): Promise<void> {
    for (const addressItem of categorizedData.address) {
      if (addressItem.element_type === 'Input in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const addressElement = await driver.wait(
              until.elementLocated(By.name(addressItem.element_name)),
              3000,
            );
            await driver.wait(until.elementIsVisible(addressElement), 3000);
            const value = await addressElement.getAttribute('value');
            if (!value.trim()) {
              let prefectureData = '';
              if (prefecture === '東京') {
                prefectureData = prefecture + '都';
              } else if (prefecture === '大阪' || prefecture === '京都') {
                prefectureData = prefecture + '府';
              } else if (prefecture === '北海道') {
                prefectureData = prefecture;
              } else {
                prefectureData = prefecture + '県';
              }
              await addressElement.sendKeys(
                prefectureData + city + streetAddress + buildingName,
              );
              console.log(
                `Address input successful for ${
                  addressItem.element_name
                } in iframe ${iframes.indexOf(iframe)}.`,
              );
              break;
            } else {
              console.log(
                `Address already filled for ${
                  addressItem.element_name
                } in iframe ${iframes.indexOf(iframe)}.`,
              );
            }
          } catch (e) {
            console.log(
              `Failed to input address in iframe ${iframes.indexOf(
                iframe,
              )}: ${e}`,
            );
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * address_prefectureの入力処理をiframe内で実行します。
   * @param driver Selenium WebDriverのインスタンス
   * @param categorizedData カテゴリ分けされたデータ
   * @param iframes iframe要素の配列
   * @param prefecture - 都道府県
   */
  async inputAddressPrefectureInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    prefecture: string,
  ): Promise<void> {
    for (const addressPrefectureItem of categorizedData.address_prefecture) {
      if (addressPrefectureItem.element_type === 'Input in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const addressPrefectureElement = await driver.wait(
              until.elementLocated(By.name(addressPrefectureItem.element_name)),
              3000,
            );
            await driver.wait(
              until.elementIsVisible(addressPrefectureElement),
              3000,
            );
            const value = await addressPrefectureElement.getAttribute('value');
            if (!value.trim()) {
              let prefectureData = '';
              if (prefecture === '東京') {
                prefectureData = prefecture + '都';
              } else if (prefecture === '大阪' || prefecture === '京都') {
                prefectureData = prefecture + '府';
              } else if (prefecture === '北海道') {
                prefectureData = prefecture;
              } else {
                prefectureData = prefecture + '県';
              }
              await addressPrefectureElement.sendKeys(prefectureData);
              console.log(
                `Address_prefecture input successful for ${
                  addressPrefectureItem.element_name
                } in iframe ${iframes.indexOf(iframe)}.`,
              );
              break;
            } else {
              console.log(
                `Address_prefecture already filled for ${
                  addressPrefectureItem.element_name
                } in iframe ${iframes.indexOf(iframe)}.`,
              );
            }
          } catch (e) {
            console.log(
              `Failed to input address_prefecture in iframe ${iframes.indexOf(
                iframe,
              )}: ${e}`,
            );
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * address_cityの入力処理をiframe内で実行します。
   * @param driver Selenium WebDriverのインスタンス
   * @param categorizedData カテゴリ分けされたデータ
   * @param iframes iframe要素の配列
   * @param city - 市区町村
   */
  async inputAddressCityInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    city: string,
  ): Promise<void> {
    for (const addressCityItem of categorizedData.address_city) {
      if (addressCityItem.element_type === 'Input in iframe') {
        for (const iframe of iframes) {
          await driver.switchTo().frame(iframe);
          try {
            const addressCityElement = await driver.wait(
              until.elementLocated(By.name(addressCityItem.element_name)),
              3000,
            );
            await driver.wait(until.elementIsVisible(addressCityElement), 3000);
            const value = await addressCityElement.getAttribute('value');
            if (!value.trim()) {
              await addressCityElement.sendKeys(city);
              console.log(
                `Address_city input successful for ${
                  addressCityItem.element_name
                } in iframe ${iframes.indexOf(iframe)}.`,
              );
              break;
            } else {
              console.log(
                `Address_city already filled for ${
                  addressCityItem.element_name
                } in iframe ${iframes.indexOf(iframe)}.`,
              );
            }
          } catch (e) {
            console.log(
              `Failed to input address_city in iframe ${iframes.indexOf(
                iframe,
              )}: ${e}`,
            );
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * iframe内で住所郵便番号の入力処理を修正します。
   *
   * @param driver - Selenium WebDriverのインスタンス
   * @param categorizedData - カテゴリ分けされたデータ
   * @param iframes - iframeのWebElementの配列
   * @param postalCode - 郵便番号
   */
  async inputAddressZipInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    postalCode: string,
  ): Promise<void> {
    for (const addressZipItem of categorizedData.address_zip) {
      if (addressZipItem.element_type === 'Input in iframe') {
        for (let i = 0; i < iframes.length; i++) {
          const iframe = iframes[i];
          await driver.switchTo().frame(iframe);
          try {
            const addressZipElement = await driver.wait(
              until.elementLocated(By.name(addressZipItem.element_name)),
              3000,
            );
            await driver.wait(until.elementIsVisible(addressZipElement), 3000);
            const value = (
              await addressZipElement.getAttribute('value')
            ).trim();
            if (!value) {
              await addressZipElement.sendKeys(postalCode);
              console.log(
                `Address_zip input successful for ${addressZipItem.element_name} in iframe ${i}.`,
              );
              break;
            } else {
              console.log(
                `Address_zip already filled for ${addressZipItem.element_name} in iframe ${i}.`,
              );
            }
          } catch (e) {
            console.log(`Failed to input address_zip in iframe ${i}: ${e}`);
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * iframe内で住所番地の入力処理を修正します。
   *
   * @param driver - Selenium WebDriverのインスタンス
   * @param categorizedData - カテゴリ分けされたデータ
   * @param iframes - iframeのWebElementの配列
   * @param streetAddress - 地域
   */
  async inputAddressStreetInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    streetAddress: string,
  ): Promise<void> {
    for (const addressStreetItem of categorizedData.address_street) {
      if (addressStreetItem.element_type === 'Input in iframe') {
        for (let i = 0; i < iframes.length; i++) {
          const iframe = iframes[i];
          await driver.switchTo().frame(iframe);
          try {
            const addressStreetElement = await driver.wait(
              until.elementLocated(By.name(addressStreetItem.element_name)),
              3000,
            );
            await driver.wait(
              until.elementIsVisible(addressStreetElement),
              3000,
            );
            const value = (
              await addressStreetElement.getAttribute('value')
            ).trim();
            if (!value) {
              await addressStreetElement.sendKeys(streetAddress);
              console.log(
                `Address_street input successful for ${addressStreetItem.element_name} in iframe ${i}.`,
              );
              break;
            } else {
              console.log(
                `Address_street already filled for ${addressStreetItem.element_name} in iframe ${i}.`,
              );
            }
          } catch (e) {
            console.log(`Failed to input address_street in iframe ${i}: ${e}`);
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * iframe内で住所のプルダウンメニューの入力処理を修正します。
   *
   * @param driver - Selenium WebDriverのインスタンス
   * @param categorizedData - カテゴリ分けされたデータ
   * @param iframes - iframeのWebElementの配列
   * @param prefecture - 都道府県
   */
  async selectAddressInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    prefecture: string,
  ): Promise<void> {
    for (const addressItem of categorizedData.address) {
      if (addressItem.element_type === 'Select in iframe') {
        for (let i = 0; i < iframes.length; i++) {
          const iframe = iframes[i];
          await driver.switchTo().frame(iframe);
          try {
            const selectElement = await driver.wait(
              until.elementLocated(By.name(addressItem.element_name)),
              3000,
            );
            const options = await selectElement.findElements(
              By.tagName('option'),
            );
            let optionSelected = false;
            for (const option of options) {
              const text = await option.getText();
              if (text.includes(prefecture)) {
                await option.click();
                console.log(
                  `Address input successful for ${addressItem.element_name} with option '${text}' in iframe ${i}.`,
                );
                optionSelected = true;
                break;
              }
            }
            if (!optionSelected) {
              console.log(
                `No suitable option found for ${addressItem.element_name} in iframe ${i}.`,
              );
            }
          } catch (e) {
            console.log(`Failed to input address in iframe ${i}: ${e}`);
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * iframe内で住所prefectureのプルダウンメニューの入力処理を修正します。
   *
   * @param driver - Selenium WebDriverのインスタンス
   * @param categorizedData - カテゴリ分けされたデータ
   * @param iframes - iframeのWebElementの配列
   * @param prefecture - 都道府県
   */
  async selectAddressPrefectureInIframe(
    driver: WebDriver,
    categorizedData: Categories,
    iframes: WebElement[],
    prefecture: string,
  ): Promise<void> {
    for (const addressPrefectureItem of categorizedData.address_prefecture) {
      if (addressPrefectureItem.element_type === 'Select in iframe') {
        for (let i = 0; i < iframes.length; i++) {
          const iframe = iframes[i];
          await driver.switchTo().frame(iframe);
          try {
            const selectElement = await driver.wait(
              until.elementLocated(By.name(addressPrefectureItem.element_name)),
              3000,
            );
            const options = await selectElement.findElements(
              By.tagName('option'),
            );
            let optionSelected = false;
            for (const option of options) {
              const text = await option.getText();
              if (text.includes(prefecture)) {
                await option.click();
                console.log(
                  `Address_prefecture input successful for ${addressPrefectureItem.element_name} with option '${text}' in iframe ${i}.`,
                );
                optionSelected = true;
                break;
              }
            }
            if (!optionSelected) {
              console.log(
                `No suitable option found for ${addressPrefectureItem.element_name} in iframe ${i}.`,
              );
            }
          } catch (e) {
            console.log(
              `Failed to input address_prefecture in iframe ${i}: ${e}`,
            );
          } finally {
            await driver.switchTo().defaultContent();
          }
        }
      }
    }
  }

  /**
   * 名前入力要素を処理します。
   *
   * @param driver - Selenium WebDriverのインスタンス
   * @param inquiryData - お問い合わせ情報
   */
  async handleNameInputElements(
    driver: WebDriver,
    inquiryData: { [key: string]: string },
  ): Promise<void> {
    // 名前に関連するキーワードリストを定義
    const nameKeywords: string[] = [
      'last_name',
      '姓',
      '苗字',
      'ラストネーム',
      'last',
      'sei',
      'first_name',
      '名前',
      '名',
      'ファースト',
      'first',
      'mei',
      '氏名',
      'namae',
      'full_name',
      'name',
      '担当者名',
      'お名前',
      'フルネーム',
      'かな',
      'ふり',
      'カナ',
      'フリ',
      'ruby',
      'ガナ',
      'kana',
      'furi',
      'kana',
    ];

    const kanaKeywords: string[] = [
      'かな',
      'ふり',
      'カナ',
      'フリ',
      'ruby',
      'ガナ',
      'kana',
      'furi',
      'kana',
    ];

    const hiraganaKeywords: string[] = ['かな', 'ふり'];

    const hiraganaSeiKeywords: string[] = [
      'last_name',
      '姓',
      '苗字',
      'ラストネーム',
      'last',
      'sei',
    ];

    const hiraganaMeiKeywords: string[] = [
      'first_name',
      '名前',
      '名',
      'ファースト',
      'first',
      'mei',
      '氏名',
      'namae',
    ];

    const hiraganaFullnameKeywords: string[] = [
      'full_name',
      'name',
      '名前',
      '氏名',
      '担当者名',
      '名',
      'お名前',
      'フルネーム',
    ];

    const katakanaKeywords: string[] = [
      'カナ',
      'フリ',
      'ruby',
      'ガナ',
      'kana',
      'furi',
      'kana',
      'セイ',
      'メイ',
    ];

    const katakanaSeiKeywords: string[] = [
      'last_name',
      '姓',
      '苗字',
      'ラストネーム',
      'last',
      'sei',
      'セイ',
    ];

    const katakanaMeiKeywords: string[] = [
      'first_name',
      '名前',
      '名',
      'ファースト',
      'first',
      'mei',
      '氏名',
      'namae',
      'メイ',
    ];

    const katakanaFullnameKeywords: string[] = [
      'full_name',
      'name',
      '名前',
      '氏名',
      '担当者名',
      '名',
      'お名前',
      'フルネーム',
    ];

    const kanjiSeiKeywords: string[] = [
      'last_name',
      '姓',
      '苗字',
      'ラストネーム',
      'last',
      'sei',
    ];

    const kanjiMeiKeywords: string[] = [
      'first_name',
      '名前',
      '名',
      'ファースト',
      'first',
      'mei',
      '氏名',
      'namae',
    ];

    const kanjiFullnameKeywords: string[] = [
      'full_name',
      'name',
      '名前',
      '氏名',
      '担当者名',
      '名',
      'お名前',
      'フルネーム',
    ];

    // input要素を全て取得
    const inputElements: WebElement[] = await driver.findElements(
      By.xpath('//input'),
    );

    // カテゴリ分類用オブジェクトを初期化
    const categories: { [key: string]: WebElement[] } = {
      name: [],
      kana: [],
      kanji: [],
      hiragana: [],
      katakana: [],
      hiragana_sei: [],
      hiragana_mei: [],
      hiragana_fullname: [],
      katakana_sei: [],
      katakana_mei: [],
      katakana_fullname: [],
      kanji_sei: [],
      kanji_mei: [],
      kanji_fullname: [],
    };

    // すべてのinput要素を'name'カテゴリに分類
    for (const inputElement of inputElements) {
      const inputName: string = (await inputElement.getAttribute('name')) || '';
      const inputId: string = (await inputElement.getAttribute('id')) || '';
      const combinedText: string = `${inputName} ${inputId}`.toLowerCase();

      if (nameKeywords.some((keyword) => combinedText.includes(keyword))) {
        categories['name'].push(inputElement);
      }
    }

    // 'name'カテゴリに分類された要素を再分類
    for (const item of categories['name']) {
      const inputName: string = (await item.getAttribute('name')) || '';
      const inputId: string = (await item.getAttribute('id')) || '';
      const combinedText: string = `${inputName} ${inputId}`.toLowerCase();

      if (kanaKeywords.some((keyword) => combinedText.includes(keyword))) {
        categories['kana'].push(item);
      } else {
        categories['kanji'].push(item);
      }
    }

    // 'kana'カテゴリに分類された要素を'hiragana'と'katakana'に再分類
    for (const item of categories['kana']) {
      const inputName: string = (await item.getAttribute('name')) || '';
      const inputId: string = (await item.getAttribute('id')) || '';
      const combinedText: string = `${inputName} ${inputId}`.toLowerCase();

      if (hiraganaKeywords.some((keyword) => combinedText.includes(keyword))) {
        categories['hiragana'].push(item);
      } else {
        categories['katakana'].push(item);
      }
    }

    // 'hiragana'カテゴリに分類された要素を'hiragana_sei'と'hiragana_mei'に再分類
    const hiraganaSeiMatches: [WebElement, number][] = [];

    for (const item of categories['hiragana']) {
      const inputName: string = (await item.getAttribute('name')) || '';
      const inputId: string = (await item.getAttribute('id')) || '';
      const combinedText: string = `${inputName} ${inputId}`.toLowerCase();

      const matchCount: number = hiraganaSeiKeywords.reduce(
        (count, keyword) => {
          return count + (combinedText.includes(keyword) ? 1 : 0);
        },
        0,
      );

      hiraganaSeiMatches.push([item, matchCount]);
    }

    if (hiraganaSeiMatches.length > 0) {
      // マッチ数が一番多いアイテムを'hiragana_sei'に分類
      const maxMatchItem = hiraganaSeiMatches.reduce((prev, current) => {
        return current[1] > prev[1] ? current : prev;
      })[0];
      categories['hiragana_sei'].push(maxMatchItem);

      // それ以外のアイテムを'hiragana_mei'に分類
      for (const [item, _] of hiraganaSeiMatches) {
        if (item !== maxMatchItem) {
          categories['hiragana_mei'].push(item);
        }
      }
    }

    // 'hiragana_sei'または'hiragana_mei'が空の場合、'hiragana_fullname'に移動
    if (
      categories['hiragana_sei'].length === 0 ||
      categories['hiragana_mei'].length === 0
    ) {
      categories['hiragana_fullname'].push(...categories['hiragana']);
      categories['hiragana'] = [];
      categories['hiragana_sei'] = [];
      categories['hiragana_mei'] = [];
    }

    // 'katakana'カテゴリに分類された要素を'katakana_sei'と'katakana_mei'に再分類
    const katakanaSeiMatches: [WebElement, number][] = [];

    for (const item of categories['katakana']) {
      const inputName: string = (await item.getAttribute('name')) || '';
      const inputId: string = (await item.getAttribute('id')) || '';
      const combinedText: string = `${inputName} ${inputId}`.toLowerCase();

      const matchCount: number = katakanaSeiKeywords.reduce(
        (count, keyword) => {
          return count + (combinedText.includes(keyword) ? 1 : 0);
        },
        0,
      );

      katakanaSeiMatches.push([item, matchCount]);
    }

    if (katakanaSeiMatches.length > 0) {
      // マッチ数が一番多いアイテムを'katakana_sei'に分類
      const maxMatchItem = katakanaSeiMatches.reduce((prev, current) => {
        return current[1] > prev[1] ? current : prev;
      })[0];
      categories['katakana_sei'].push(maxMatchItem);

      // それ以外のアイテムを'katakana_mei'に分類
      for (const [item, _] of katakanaSeiMatches) {
        if (item !== maxMatchItem) {
          categories['katakana_mei'].push(item);
        }
      }
    }

    // 'katakana_sei'または'katakana_mei'が空の場合、'katakana_fullname'に移動
    if (
      categories['katakana_sei'].length === 0 ||
      categories['katakana_mei'].length === 0
    ) {
      categories['katakana_fullname'].push(...categories['katakana']);
      categories['katakana'] = [];
      categories['katakana_sei'] = [];
      categories['katakana_mei'] = [];
    }

    // 'kanji'カテゴリに分類された要素を'kanji_sei'と'kanji_mei'に再分類
    const kanjiSeiMatches: [WebElement, number][] = [];

    for (const item of categories['kanji']) {
      const inputName: string = (await item.getAttribute('name')) || '';
      const inputId: string = (await item.getAttribute('id')) || '';
      const combinedText: string = `${inputName} ${inputId}`.toLowerCase();

      const matchCount: number = kanjiSeiKeywords.reduce((count, keyword) => {
        return count + (combinedText.includes(keyword) ? 1 : 0);
      }, 0);

      kanjiSeiMatches.push([item, matchCount]);
    }

    if (kanjiSeiMatches.length > 0) {
      // マッチ数が一番多いアイテムを'kanji_sei'に分類
      const maxMatchItem = kanjiSeiMatches.reduce((prev, current) => {
        return current[1] > prev[1] ? current : prev;
      })[0];
      categories['kanji_sei'].push(maxMatchItem);

      // それ以外のアイテムを'kanji_mei'に分類
      for (const [item, _] of kanjiSeiMatches) {
        if (item !== maxMatchItem) {
          categories['kanji_mei'].push(item);
        }
      }
    }

    // 'kanji_sei'または'kanji_mei'が空の場合、'kanji_fullname'に移動
    if (
      categories['kanji_sei'].length === 0 ||
      categories['kanji_mei'].length === 0
    ) {
      categories['kanji_fullname'].push(...categories['kanji']);
      categories['kanji'] = [];
      categories['kanji_sei'] = [];
      categories['kanji_mei'] = [];
    }

    // 各カテゴリに適切な値を入力
    const inputValues: { [key: string]: string } = {
      hiragana_sei: inquiryData.lastNameHiragana,
      hiragana_mei: inquiryData.firstNameHiragana,
      hiragana_fullname:
        inquiryData.lastNameHiragana + inquiryData.firstNameHiragana,
      katakana_sei: inquiryData.lastNameKatakana,
      katakana_mei: inquiryData.firstNameKatakana,
      katakana_fullname:
        inquiryData.lastNameKatakana + inquiryData.firstNameKatakana,
      kanji_sei: inquiryData.lastName,
      kanji_mei: inquiryData.firstName,
      kanji_fullname: inquiryData.lastName + inquiryData.firstName,
    };

    for (const [category, value] of Object.entries(inputValues)) {
      for (const element of categories[category]) {
        try {
          const currentValue: string =
            (await element.getAttribute('value')) || '';
          if (!currentValue.trim()) {
            // 入力欄が空の場合だけ入力
            await element.sendKeys(value);
            console.log(`'${category}' に '${value}' を入力しました。`);
          }
        } catch (error) {
          console.log(error);
          continue;
        }
      }
    }
  }

  /**
   * inputとtextarea要素を処理し、適切な値を入力する関数
   *
   * @param driver - Selenium WebDriverのインスタンス
   * @param inputKeywords - カテゴリごとのキーワードリストを定義
   * @param extractedData - 抽出されたデータを格納する配列
   * @param inquiryData - お問い合わせ情報
   */
  async processInputsAndTextareas(
    driver: WebDriver,
    inputKeywords: Record<string, string[]>,
    extractedData: ExtractedData[],
    inquiryData: { [key: string]: string },
  ): Promise<void> {
    // ページ内のすべてのinput要素を取得
    const inputElements: WebElement[] = await driver.findElements(
      By.xpath('//input'),
    );

    // フラグを定義して名前要素の存在を確認
    let addressFilled: boolean = false; // addressが記入されたかを確認するフラグ

    // input要素に対して操作を行う
    for (const inputElement of inputElements) {
      try {
        // input要素がすでに値を持っているか確認
        const isDisplayed = await inputElement.isDisplayed(); // 要素が表示されているか確認
        if (!isDisplayed) continue; // 非表示要素はスキップ
        // input要素がすでに値を持っているか確認
        const currentValue: string =
          (await inputElement.getAttribute('value')) || '';
        if (!currentValue.trim()) {
          // 空チェックを追加
          const inputName: string =
            (await inputElement.getAttribute('name')) || '';
          const inputId: string = (await inputElement.getAttribute('id')) || '';
          let selectedInput: string | null = null; // 入力された要素を保持する変数

          // キーワードに基づいて適切な値を入力
          for (const [category, keywords] of Object.entries(inputKeywords)) {
            for (const keyword of keywords) {
              if (
                keyword.toLowerCase() === (inputName || '').toLowerCase() ||
                keyword.toLowerCase() === (inputId || '').toLowerCase()
              ) {
                // addressが既に入力されている場合、address_streetとaddress_cityはスキップ
                if (
                  addressFilled &&
                  (category === 'address_street' || category === 'address_city')
                ) {
                  console.log(
                    `Skipping ${category} as address is already filled.`,
                  );
                  continue;
                }
                let prefectureData = '';
                if (inquiryData.prefecture === '東京') {
                  prefectureData = inquiryData.prefecture + '都';
                } else if (
                  inquiryData.prefecture === '大阪' ||
                  inquiryData.prefecture === '京都'
                ) {
                  prefectureData = inquiryData.prefecture + '府';
                } else if (inquiryData.prefecture === '北海道') {
                  prefectureData = inquiryData.prefecture;
                } else {
                  prefectureData = inquiryData.prefecture + '県';
                }

                // カテゴリに基づいて適切な値を入力
                switch (category) {
                  case 'departments':
                    await inputElement.sendKeys(inquiryData.department);
                    selectedInput = inquiryData.department;
                    break;
                  case 'positions':
                    await inputElement.sendKeys(inquiryData.jobPosition);
                    selectedInput = inquiryData.jobPosition;
                    break;
                  case 'email_addresses':
                    await inputElement.sendKeys(inquiryData.emailAddress);
                    selectedInput = inquiryData.emailAddress;
                    break;
                  case 'phone_numbers':
                    await inputElement.sendKeys(inquiryData.phoneNumber);
                    selectedInput = inquiryData.phoneNumber;
                    break;
                  case 'company_names':
                    await inputElement.sendKeys(inquiryData.corporateName);
                    selectedInput = inquiryData.corporateName;
                    break;
                  case 'employee_sizes':
                    await inputElement.sendKeys(inquiryData.employeeSize);
                    selectedInput = inquiryData.employeeSize;
                    break;
                  case 'post_code':
                    await inputElement.sendKeys(inquiryData.postalCode);
                    selectedInput = inquiryData.postalCode;
                    break;
                  case 'address':
                    await inputElement.sendKeys(
                      prefectureData +
                        inquiryData.city +
                        inquiryData.streetAddress +
                        inquiryData.buildingName,
                    );
                    selectedInput =
                      prefectureData +
                      inquiryData.city +
                      inquiryData.streetAddress +
                      inquiryData.buildingName;
                    addressFilled = true; // addressが入力されたことをフラグで記録
                    break;
                  case 'url':
                    await inputElement.sendKeys(inquiryData.myCorporateURL);
                    selectedInput = inquiryData.myCorporateURL;
                    break;
                  case 'industry':
                    await inputElement.sendKeys(inquiryData.industryType);
                    selectedInput = inquiryData.industryType;
                    break;
                  case 'how_found':
                    await inputElement.sendKeys('検索');
                    selectedInput = '検索';
                    break;
                  case 'address_street':
                    await inputElement.sendKeys(inquiryData.streetAddress);
                    selectedInput = inquiryData.streetAddress;
                    break;
                  case 'address_prefecture':
                    await inputElement.sendKeys(prefectureData);
                    selectedInput = prefectureData;
                    break;
                  case 'address_city':
                    await inputElement.sendKeys(inquiryData.city);
                    selectedInput = inquiryData.city;
                    break;
                  case 'fax_numbers':
                    await inputElement.sendKeys(inquiryData.fax);
                    selectedInput = inquiryData.fax;
                    break;
                  case 'inquiry_genre':
                    await inputElement.sendKeys(inquiryData.inquirySubject);
                    selectedInput = inquiryData.inquirySubject;
                    break;
                  case 'introduction_time':
                    await inputElement.sendKeys('未定');
                    selectedInput = '未定';
                    break;
                  default:
                    // 未定義のカテゴリの場合はスキップ
                    continue;
                }

                console.log(
                  `${category} input successful for ${inputName || inputId}.`,
                );
                break; // キーワードに一致したら次の要素へ
              }
            }

            if (selectedInput) {
              break; // 一つの要素に複数のカテゴリがマッチするのを防ぐためにループを抜ける
            }
          }

          // 抽出データに追加
          if (selectedInput) {
            try {
              const parentElement: WebElement | null =
                await inputElement.findElement(By.xpath('..'));
              const trElement: WebElement | null =
                await inputElement.findElement(By.xpath('ancestor::tr'));

              const parentText: string = parentElement
                ? (await parentElement.getText()).trim()
                : '';
              const trText: string = trElement
                ? (await trElement.getText()).trim()
                : '';

              extractedData.push({
                id: null,
                category: null,
                element_name: inputName || inputId,
                element_value: null,
                element_text: selectedInput,
                parent_text: parentText,
                siblings_text: '', // 必要に応じて追加
                class_name: (await inputElement.getAttribute('class')) || '',
                label_text: '', // 必要に応じて追加
                element_type: 'input',
                tr_text: trText,
              });
            } catch (err) {
              console.error(
                `Failed to extract additional information for ${
                  inputName || inputId
                }: ${(err as Error).message}`,
              );
            }
          }
        } else {
          console.log(
            `Input already filled for ${
              inputElement.getAttribute('name') ||
              inputElement.getAttribute('id')
            }.`,
          );
        }
      } catch (e) {
        console.error(
          `Failed to handle input element: ${(e as Error).message}`,
        );
      }
    }

    // ページ内のすべてのtextarea要素を処理
    // try {
    //   // ページ内のすべてのtextarea要素を取得
    //   const textareaElements: WebElement[] = await driver.findElements(
    //     By.xpath('//textarea'),
    //   );

    //   // textarea要素に対して操作を行う
    //   for (const textareaElement of textareaElements) {
    //     try {
    //       // テキストエリアが空欄かどうかをチェック
    //       const textareaValue: string =
    //         (await textareaElement.getAttribute('value')) || '';
    //       if (!textareaValue.trim()) {
    //         // 空欄なら適切な値を入力 ▲謎の処理
    //         await textareaElement.sendKeys(inquiryData.inquiryBody);
    //         console.log(
    //           `Textarea input successful for ${
    //             (await textareaElement.getAttribute('name')) ||
    //             (await textareaElement.getAttribute('id'))
    //           }.`,
    //         );

    //         // 抽出データに追加
    //         try {
    //           const parentElement: WebElement | null =
    //             await textareaElement.findElement(By.xpath('..'));
    //           const trElement: WebElement | null =
    //             await textareaElement.findElement(By.xpath('ancestor::tr'));

    //           const parentText: string = parentElement
    //             ? (await parentElement.getText()).trim()
    //             : '';
    //           const trText: string = trElement
    //             ? (await trElement.getText()).trim()
    //             : '';

    //           extractedData.push({
    //             id: null,
    //             category: null,
    //             element_name:
    //               (await textareaElement.getAttribute('name')) ||
    //               (await textareaElement.getAttribute('id')),
    //             element_text: inquiryData.inquiryBody,
    //             element_value: null,
    //             parent_text: parentText,
    //             siblings_text: '', // 必要に応じて追加
    //             class_name: (await textareaElement.getAttribute('class')) || '',
    //             label_text: '', // 必要に応じて追加
    //             element_type: 'textarea',
    //             tr_text: trText,
    //           });
    //         } catch (err) {
    //           console.error(
    //             `Failed to extract additional information for textarea: ${
    //               (err as Error).message
    //             }`,
    //           );
    //         }
    //       }
    //     } catch (e) {
    //       console.error(
    //         `Failed to handle textarea element: ${(e as Error).message}`,
    //       );
    //     }
    //   }
    // } catch (e) {
    //   console.error(
    //     `Failed to retrieve textarea elements: ${(e as Error).message}`,
    //   );
    // }
  }

  /**
   * 同意に関連するチェックボックスを処理し、適切な値を入力・選択する関数
   *
   * @param driver - Selenium WebDriverのインスタンス
   * @param extractedData - 抽出されたデータを格納する配列
   */
  async handleAgreementCheckboxesCombined(
    driver: WebDriver,
    extractedData: ExtractedData[],
  ): Promise<void> {
    // 同意に関連するキーワードリストを定義
    const agreementKeywords: string[] = [
      '同意',
      '確認',
      '間違い',
      '承認',
      'プライバシー',
      '承知',
      'メルマガ',
      'agree',
      'policy',
      'opt',
      'privacy',
      'accept',
      '内容',
    ];

    try {
      // ページ内のすべてのチェックボックスを取得
      const checkboxElements: WebElement[] = await driver.findElements(
        By.xpath("//input[@type='checkbox']"),
      );

      for (let index = 0; index < checkboxElements.length; index++) {
        const checkboxElement = checkboxElements[index];
        try {
          // チェックボックスの状態を取得
          const isSelected: boolean = await checkboxElement.isSelected();

          // チェックボックスの属性を取得
          const checkboxId: string =
            (await checkboxElement.getAttribute('id')) || '';
          const checkboxName: string =
            (await checkboxElement.getAttribute('name')) || '';
          const checkboxValue: string =
            (await checkboxElement.getAttribute('value')) || '';

          // チェックボックスのID, name, valueにキーワードが含まれているか確認
          const attrMatches: boolean = agreementKeywords.some(
            (keyword) =>
              checkboxId.includes(keyword) ||
              checkboxName.includes(keyword) ||
              checkboxValue.includes(keyword),
          );

          // チェックボックスの親要素（ラベルまたはtrタグ）のテキストを取得
          let parentText: string = '';
          try {
            const parentLabel: WebElement = await checkboxElement.findElement(
              By.xpath('..'),
            );
            parentText = (await parentLabel.getText()).trim();
          } catch (e) {
            console.warn(`親ラベルの取得に失敗: ${(e as Error).message}`);
          }

          // tr要素のテキストを取得
          let trElementText: string = '';
          try {
            const trElement: WebElement = await checkboxElement.findElement(
              By.xpath('ancestor::tr'),
            );
            if (trElement) {
              trElementText = (await trElement.getText()).trim();
            }
          } catch (trError) {
            console.warn(
              `<tr>祖先が見つかりません: ${(trError as Error).message}`,
            );
          }

          // ラベルまたはtr要素のテキストにキーワードが含まれているか確認
          const textMatches: boolean = agreementKeywords.some(
            (keyword) =>
              parentText.includes(keyword) || trElementText.includes(keyword),
          );

          // キーワードに一致する場合
          if (attrMatches || textMatches) {
            if (!isSelected) {
              let checkboxSelected: boolean = false;

              // ラベルクリックを試みる
              if (parentText) {
                try {
                  await this.parentLabelClick(
                    driver,
                    checkboxElement,
                    parentText,
                  );
                  checkboxSelected = await checkboxElement.isSelected();
                  console.log(
                    `ラベルをクリックしてチェックボックスを選択: '${parentText}'`,
                  );
                } catch (labelClickError) {
                  console.warn(
                    `ラベルクリックに失敗: ${
                      (labelClickError as Error).message
                    }`,
                  );
                }
              }

              // 再度状態確認し、チェックが入っていなければJavaScriptでクリックを試みる
              if (!checkboxSelected) {
                try {
                  await driver.executeScript(
                    'arguments[0].click();',
                    checkboxElement,
                  );
                  checkboxSelected = await checkboxElement.isSelected();
                  console.log(
                    `JavaScriptでチェックボックスを選択: '${parentText}'`,
                  );
                } catch (jsClickError) {
                  console.warn(
                    `JavaScriptクリックに失敗: ${
                      (jsClickError as Error).message
                    }`,
                  );
                }
              }

              // まだ選択されていない場合、直接のクリックも試みる
              if (!checkboxSelected) {
                try {
                  await checkboxElement.click();
                  checkboxSelected = await checkboxElement.isSelected();
                  console.log(
                    `チェックボックスを直接クリックして選択: '${parentText}'`,
                  );
                } catch (directClickError) {
                  console.warn(
                    `直接クリックに失敗: ${
                      (directClickError as Error).message
                    }`,
                  );
                }
              }

              // 抽出データに追加
              if (checkboxSelected) {
                extractedData.push({
                  id: null,
                  category: null,
                  element_name: checkboxName || checkboxId,
                  element_value: checkboxValue,
                  element_text: parentText || trElementText,
                  parent_text: parentText,
                  siblings_text: '', // 必要に応じて追加
                  class_name:
                    (await checkboxElement.getAttribute('class')) || '',
                  label_text: '', // 必要に応じて追加
                  element_type: 'checkbox',
                  tr_text: trElementText, // tr要素のテキストを追加
                });
              }
            } else {
              console.log(
                `チェックボックスは既に選択されています: id='${checkboxId}', name='${checkboxName}', value='${checkboxValue}'`,
              );
            }
          }
        } catch (checkboxError) {
          console.error(
            `チェックボックスの処理に失敗しました: ${
              (checkboxError as Error).message
            }`,
          );
        }
      }
    } catch (checkboxError) {
      console.error(
        `チェックボックスの処理に失敗しました: ${
          (checkboxError as Error).message
        }`,
      );
    }
  }

  /**
   * チェックボックスの親ラベルをクリックする補助関数
   *
   * @param driver - Selenium WebDriverのインスタンス
   * @param checkboxElement - チェックボックスのWebElement
   * @param parentText - 親ラベルのテキスト
   */
  async parentLabelClick(
    driver: WebDriver,
    checkboxElement: WebElement,
    parentText: string,
  ): Promise<void> {
    try {
      // 親ラベルがlabel要素の場合
      const labelElement: WebElement = await checkboxElement.findElement(
        By.xpath('ancestor::label'),
      );
      await labelElement.click();
    } catch (e) {
      // 親ラベルがlabel要素でない場合、何もしない
      throw new Error(
        `親ラベルがlabel要素ではありません: ${(e as Error).message}`,
      );
    }
  }
  /**
   * ページ内のiframeを確認し、inputおよびtextarea要素を処理します。
   *
   * @param driver - Selenium WebDriverのインスタンス
   * @param inputKeywords - 入力要素のカテゴリとキーワードのマップ
   * @param extractedData - 抽出されたデータを格納する配列
   * @param inquiryData - お問い合わせ情報
   */
  async processInputsAndTextareas2(
    driver: WebDriver,
    inputKeywords: Record<string, string[]>,
    extractedData: any[],
    inquiryData: { [key: string]: string },
  ): Promise<void> {
    try {
      const iframes: WebElement[] = await driver.findElements(
        By.tagName('iframe'),
      );
      if (iframes.length > 0) {
        for (let index = 0; index < iframes.length; index++) {
          const iframe = iframes[index];
          await driver.switchTo().frame(iframe);
          console.log(`Switched to iframe ${index}`);

          const inputElements = await driver.findElements(By.xpath('//input'));
          const textareaElements = await driver.findElements(
            By.xpath('//textarea'),
          );

          if (inputElements.length > 0 || textareaElements.length > 0) {
            await this.handleFormElements(
              driver,
              inputElements,
              textareaElements,
              inputKeywords,
              extractedData,
              inquiryData,
            );
          }

          await driver.switchTo().defaultContent(); // iframeから戻る
        }
      } else {
        console.log('iframeが見つからなかったため、ページ全体を確認します。');
        const inputElements = await driver.findElements(By.xpath('//input'));
        const textareaElements = await driver.findElements(
          By.xpath('//textarea'),
        );
        await this.handleFormElements(
          driver,
          inputElements,
          textareaElements,
          inputKeywords,
          extractedData,
          inquiryData,
        );
      }
    } catch (error) {
      console.error(
        `processInputsAndTextareas2でエラーが発生しました: ${error}`,
      );
    }
  }

  /**
   * inputおよびtextarea要素を処理し、必要に応じてデータを入力および抽出します。
   *
   * @param driver - Selenium WebDriverのインスタンス
   * @param inputElements - 処理対象のinput要素の配列
   * @param textareaElements - 処理対象のtextarea要素の配列
   * @param inputKeywords - 入力要素のカテゴリとキーワードのマップ
   * @param extractedData - 抽出されたデータを格納する配列
   * @param inquiryData - お問い合わせ情報
   */
  async handleFormElements(
    driver: WebDriver,
    inputElements: WebElement[],
    textareaElements: WebElement[],
    inputKeywords: Record<string, string[]>,
    extractedData: any[],
    inquiryData: { [key: string]: string },
  ): Promise<void> {
    // input要素の処理
    for (const inputElement of inputElements) {
      try {
        const value = await inputElement.getAttribute('value');
        if (!value || value.trim() === '') {
          // 空欄チェック
          const inputName =
            (await inputElement.getAttribute('name')) ||
            (await inputElement.getAttribute('id')) ||
            '';
          let matched = false;

          for (const [category, keywords] of Object.entries(inputKeywords)) {
            for (const keyword of keywords) {
              if (inputName.toLowerCase().includes(keyword)) {
                await this.fillInputBasedOnCategory(
                  inputElement,
                  category,
                  inquiryData,
                );
                const parentElement = await inputElement.findElement(
                  By.xpath('..'),
                );
                const parentText = (await parentElement.getText()).trim();

                extractedData.push({
                  element_name: inputName,
                  element_type: 'input',
                  parent_text: parentText,
                  value: await inputElement.getAttribute('value'),
                });
                matched = true;
                break;
              }
            }
            if (matched) break;
          }
        }
      } catch (e) {
        console.error(`Input処理に失敗しました: ${e}`);
      }
    }

    // textarea要素の処理
    for (const textareaElement of textareaElements) {
      try {
        const value = await textareaElement.getAttribute('value');
        if (!value || value.trim() === '') {
          // 空欄チェック ▲
          await textareaElement.sendKeys(inquiryData.inquiryBody);
          const textareaName =
            (await textareaElement.getAttribute('name')) ||
            (await textareaElement.getAttribute('id')) ||
            '';
          const parentElement = await textareaElement.findElement(
            By.xpath('..'),
          );
          const parentText = (await parentElement.getText()).trim();

          extractedData.push({
            element_name: textareaName,
            element_type: 'textarea',
            parent_text: parentText,
            value: await textareaElement.getAttribute('value'),
          });
        }
      } catch (e) {
        console.error(`Textarea処理に失敗しました: ${e}`);
      }
    }
  }

  /**
   * カテゴリに基づいてinput要素に適切な値を入力します。
   *
   * @param inputElement - 処理対象のinput要素
   * @param category - 入力要素のカテゴリ
   * @param inquiryData - お問い合わせ情報
   */
  async fillInputBasedOnCategory(
    inputElement: WebElement,
    category: string,
    inquiryData: { [key: string]: string },
  ): Promise<void> {
    try {
      const value = await inputElement.getAttribute('value');
      if (!value || value.trim() === '') {
        let prefectureData = '';
        if (inquiryData.prefecture === '東京') {
          prefectureData = inquiryData.prefecture + '都';
        } else if (
          inquiryData.prefecture === '大阪' ||
          inquiryData.prefecture === '京都'
        ) {
          prefectureData = inquiryData.prefecture + '府';
        } else if (inquiryData.prefecture === '北海道') {
          prefectureData = inquiryData.prefecture;
        } else {
          prefectureData = inquiryData.prefecture + '県';
        }
        // 空欄チェック
        switch (category) {
          case 'email_addresses':
            await inputElement.sendKeys(inquiryData.emailAddress);
            break;
          case 'phone_numbers':
            await inputElement.sendKeys(inquiryData.phoneNumber);
            break;
          case 'company_names':
            await inputElement.sendKeys(inquiryData.corporateName);
            break;
          case 'post_code':
            await inputElement.sendKeys(inquiryData.postalCode);
            break;
          case 'departments':
            await inputElement.sendKeys(inquiryData.department);
            break;
          case 'positions':
            await inputElement.sendKeys(inquiryData.jobPosition);
            break;
          case 'employee_sizes':
            await inputElement.sendKeys(inquiryData.employeeSize);
            break;
          case 'address':
            await inputElement.sendKeys(
              prefectureData +
                inquiryData.city +
                inquiryData.streetAddress +
                inquiryData.buildingName,
            );
            break;
          case 'url':
            await inputElement.sendKeys(inquiryData.myCorporateURL);
            break;
          case 'industry':
            await inputElement.sendKeys(inquiryData.industryType);
            break;
          case 'how_found':
            await inputElement.sendKeys('検索');
            break;
          case 'address_street':
            await inputElement.sendKeys(inquiryData.streetAddress);
            break;
          case 'address_prefecture':
            await inputElement.sendKeys(prefectureData);
            break;
          case 'address_city':
            await inputElement.sendKeys(inquiryData.city);
            break;
          case 'fax_numbers':
            await inputElement.sendKeys(inquiryData.fax);
            break;
          case 'inquiry_genre':
            await inputElement.sendKeys(inquiryData.inquirySubject);
            break;
          case 'introduction_time':
            await inputElement.sendKeys('未定');
            break;
          case 'kanji_fullname':
            await inputElement.sendKeys(
              inquiryData.lastName + inquiryData.firstName,
            );
            break;
          case 'kanji_sei':
            await inputElement.sendKeys(inquiryData.lastName);
            break;
          case 'kanji_mei':
            await inputElement.sendKeys(inquiryData.firstName);
            break;
          case 'hiragana_fullname':
            await inputElement.sendKeys(
              inquiryData.lastNameHiragana + inquiryData.firstNameHiragana,
            );
            break;
          case 'hiragana_sei':
            await inputElement.sendKeys(inquiryData.lastNameHiragana);
            break;
          case 'hiragana_mei':
            await inputElement.sendKeys(inquiryData.firstNameHiragana);
            break;
          case 'katakana_fullname':
            await inputElement.sendKeys(
              inquiryData.lastNameKatakana + inquiryData.firstNameKatakana,
            );
            break;
          case 'katakana_sei':
            await inputElement.sendKeys(inquiryData.lastNameKatakana);
            break;
          case 'katakana_mei':
            await inputElement.sendKeys(inquiryData.firstNameKatakana);
            break;
          default:
            console.warn(`未対応のカテゴリ: ${category}`);
        }
      }
    } catch (error) {
      console.error(`fillInputBasedOnCategoryでエラーが発生しました: ${error}`);
    }
  }

  /**
   * お問い合わせフォームの送信ボタンを検出してクリックします。
   * @param driver Selenium WebDriverのインスタンス
   */
  async isClickSendButton(driver: WebDriver, url: string): Promise<boolean> {
    try {
      // 1. すべてのiframeを取得
      const iframes: WebElement[] = await driver.findElements(
        By.tagName('iframe'),
      );
      console.log(`${url}: 見つかったiframeの数: ${iframes.length}`);

      if (iframes.length > 0) {
        // 2. 各iframeを順番にチェック
        for (let i = 0; i < iframes.length; i++) {
          try {
            // iframeに切り替える
            await driver.switchTo().frame(iframes[i]);
            console.log(`${url}: iframe #${i + 1} に切り替えました。`);

            // 送信ボタンを探すためのセレクターを複数試みます
            const sendButtonSelectors = [
              By.css('button[type="submit"]'),
              By.css('input[type="submit"]'),
              By.xpath("//button[contains(text(), '送信')]"),
              By.xpath("//input[@value='送信']"),
              By.xpath("//button[contains(text(), '確認')]"),
              By.xpath("//button[.//*[contains(text(), '送信')]]"),
              By.css('button[name="submit"]'),
              By.css('input[name="submit"]'),
            ];

            let sendButton: WebElement | null = null;

            for (const selector of sendButtonSelectors) {
              try {
                console.log(`${url}: 検出条件: ${selector}`);
                sendButton = await driver.findElement(selector);
                if (sendButton) {
                  console.log(
                    `${url}: 送信ボタンをiframe #${i + 1} で検出しました。`,
                  );
                  await sendButton.click(); // 必要に応じてコメントアウトを外してください
                  console.log(`${url}: 送信ボタンをクリックしました。`);
                  // 送信ボタンをクリックした後、元のコンテキストに戻る
                  await driver.switchTo().defaultContent();
                  return true;
                }
              } catch (err) {
                // 見つからなかった場合は次のセレクターを試す
                continue;
              }
            }

            // 送信ボタンが見つからなかった場合、元のコンテキストに戻る
            await driver.switchTo().defaultContent();
          } catch (iframeError) {
            console.error(
              `${url}: iframe #${i + 1} の処理中にエラーが発生しました。`,
              iframeError,
            );
            // エラーが発生した場合でも元のコンテキストに戻る
            await driver.switchTo().defaultContent();
            continue;
          }
        }
      }

      // iframe内で送信ボタンが見つからなかった場合、メインコンテンツでも探す
      console.log(
        `${url}: iframe内で送信ボタンが見つからなかったため、メインコンテンツをチェックします。`,
      );
      const mainContentSendButtonSelectors = [
        By.css('button[type="submit"]'),
        By.css('input[type="submit"]'),
        By.xpath("//button[contains(text(), '送信')]"),
        By.xpath("//input[@value='送信']"),
        By.xpath("//button[contains(text(), '確認')]"),
        By.xpath("//button[.//*[contains(text(), '送信')]]"),
        By.css('button[name="submit"]'),
        By.css('input[name="submit"]'),
      ];

      let mainSendButton: WebElement | null = null;

      for (const selector of mainContentSendButtonSelectors) {
        try {
          console.log(`${url}: メインコンテンツの検出条件: ${selector}`);
          mainSendButton = await driver.findElement(selector);
          if (mainSendButton) {
            console.log(`${url}: メインコンテンツで送信ボタンを検出しました。`);
            await mainSendButton.click(); // 必要に応じてコメントアウトを外してください
            console.log(`${url}: 送信ボタンをクリックしました。`);
            return true;
          }
        } catch (err) {
          // 見つからなかった場合は次のセレクターを試す
          continue;
        }
      }

      console.log(`${url}: 送信ボタンが見つかりませんでした。`);
      return false;
    } catch (error) {
      console.error(
        `${url}: 送信ボタンのクリック中にエラーが発生しました:`,
        error,
      );
      try {
        // エラー発生時にも元のコンテキストに戻す
        await driver.switchTo().defaultContent();
      } catch (switchError) {
        console.error(
          `${url}: 元のコンテキストに戻す際にエラーが発生しました:`,
          switchError,
        );
      }
      return false;
    }
  }

  /**
   * 入力項目エラー画面が表示されているかを検出します。
   * 「入力項目エラー」というテキストを含む要素を基に判定します。
   * @param driver Selenium WebDriverのインスタンス
   * @returns 入力項目エラー画面が表示されていればtrue、そうでなければfalse
   */
  async isInputErrorDisplayed(driver: WebDriver): Promise<boolean> {
    try {
      // 1. すべてのiframeを取得
      const iframes: WebElement[] = await driver.findElements(
        By.tagName('iframe'),
      );
      console.log(`見つかったiframeの数: ${iframes.length}`);

      if (iframes.length > 0) {
        // 2. 各iframeを順番にチェック
        for (let i = 0; i < iframes.length; i++) {
          try {
            // iframeに切り替える
            await driver.switchTo().frame(iframes[i]);
            console.log(`iframe #${i + 1} に切り替えました。`);

            // 送信ボタンを探すためのセレクターを複数試みます
            const iframeInputErrorSelectors: By[] = [
              By.xpath("//*[contains(text(), '入力しなおして')]"),
              By.xpath("//*[contains(text(), '入力してください')]"),
              By.xpath("//*[contains(text(), '必須項目です')]"),
              By.xpath("//*[contains(text(), '誤りがあります')]"),
              By.xpath("//*[contains(text(), '再度入力')]"),
              By.xpath("//*[contains(text(), '有効な数字')]"),
              By.xpath("//*[contains(text(), '有効な日付')]"),
              By.xpath("//*[contains(text(), '無効な文字')]"),
              By.xpath("//*[contains(text(), '短すぎます')]"),
              By.xpath("//*[contains(text(), '長すぎます')]"),
            ];

            for (const selector of iframeInputErrorSelectors) {
              const elements = await driver.findElements(selector);
              if (elements.length > 0) {
                console.log('Iframeで入力項目エラーが表示されています。');
                return false;
              }
            }

            // 入力項目エラーが見つからなかった場合、元のコンテキストに戻る
            await driver.switchTo().defaultContent();
          } catch (iframeError) {
            console.error(
              `iframe #${i + 1} の処理中にエラーが発生しました。`,
              iframeError,
            );
            // エラーが発生した場合でも元のコンテキストに戻る
            await driver.switchTo().defaultContent();
            continue;
          }
        }
      }

      // iframe内で入力項目エラーが見つからなかった場合、メインコンテンツでも探す
      console.log(
        `iframe内で入力項目エラーが見つからなかったため、メインコンテンツをチェックします。`,
      );
      const inputErrorSelectors: By[] = [
        By.xpath("//*[contains(text(), '入力しなおして')]"),
        By.xpath("//*[contains(text(), '入力してください')]"),
        By.xpath("//*[contains(text(), '必須項目です')]"),
        By.xpath("//*[contains(text(), '誤りがあります')]"),
        By.xpath("//*[contains(text(), '再度入力')]"),
        By.xpath("//*[contains(text(), '有効な数字')]"),
        By.xpath("//*[contains(text(), '有効な日付')]"),
        By.xpath("//*[contains(text(), '無効な文字')]"),
        By.xpath("//*[contains(text(), '短すぎます')]"),
        By.xpath("//*[contains(text(), '長すぎます')]"),
      ];

      for (const selector of inputErrorSelectors) {
        const elements = await driver.findElements(selector);
        if (elements.length > 0) {
          console.log('入力項目エラーが表示されています。');
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error(`入力項目エラー検出中にエラーが発生しました:`, error);
      try {
        // エラー発生時にも元のコンテキストに戻す
        await driver.switchTo().defaultContent();
      } catch (switchError) {
        console.error(
          `元のコンテキストに戻す際にエラーが発生しました:`,
          switchError,
        );
      }
      return false;
    }
  }

  /**
   * 確認画面が表示されているかを検出します。
   * 確認画面の特定の要素やテキストを基に判定します。
   * @param driver Selenium WebDriverのインスタンス
   * @returns 確認画面が表示されていればtrue、そうでなければfalse
   */
  async isConfirmationScreenDisplayed(driver: WebDriver): Promise<boolean> {
    try {
      // 1. すべてのiframeを取得
      const iframes: WebElement[] = await driver.findElements(
        By.tagName('iframe'),
      );
      console.log(`見つかったiframeの数: ${iframes.length}`);

      if (iframes.length > 0) {
        // 2. 各iframeを順番にチェック
        for (let i = 0; i < iframes.length; i++) {
          try {
            // iframeに切り替える
            await driver.switchTo().frame(iframes[i]);
            console.log(`iframe #${i + 1} に切り替えました。`);

            // 確認画面を探すためのセレクターを複数試みます
            const iframeConfirmationSelectors: By[] = [
              By.xpath("//*[contains(text(), '確認')]"),
              By.xpath("//*[contains(text(), 'confirm')]"),
              By.xpath("//*[contains(text(), '送信前')]"),
              By.xpath("//*[contains(text(), '間違いがなければ')]"),
              By.xpath("//*[contains(text(), '送信してもよろしい')]"),
              By.xpath("//*[contains(text(), '送信する')]"),
              By.xpath("//*[contains(text(), '送信')]"),
              By.css('.confirm'), // クラス名がconfirmの要素
              By.css('.confirmation'), // クラス名がconfirmationの要素
              By.xpath("//div[contains(@id, 'confirm')]"), // idにconfirmationを含むdiv
            ];

            for (const selector of iframeConfirmationSelectors) {
              const elements = await driver.findElements(selector);
              if (elements.length > 0) {
                console.log('Iframeで確認画面が表示されています。');
                return true;
              }
            }

            // 確認画面が見つからなかった場合、元のコンテキストに戻る
            await driver.switchTo().defaultContent();
          } catch (iframeError) {
            console.error(
              `iframe #${i + 1} の処理中にエラーが発生しました。`,
              iframeError,
            );
            // エラーが発生した場合でも元のコンテキストに戻る
            await driver.switchTo().defaultContent();
            continue;
          }
        }
      }

      // iframe内で確認画面が見つからなかった場合、メインコンテンツでも探す
      console.log(
        `iframe内で確認画面が見つからなかったため、メインコンテンツをチェックします。`,
      );
      const confirmationSelectors: By[] = [
        By.xpath("//*[contains(text(), '確認')]"),
        By.xpath("//*[contains(text(), 'confirm')]"),
        By.xpath("//*[contains(text(), '送信前')]"),
        By.xpath("//*[contains(text(), '間違いがなければ')]"),
        By.xpath("//*[contains(text(), '送信してもよろしい')]"),
        By.xpath("//*[contains(text(), '送信する')]"),
        By.xpath("//*[contains(text(), '送信')]"),
        By.css('.confirm'), // クラス名がconfirmの要素
        By.css('.confirmation'), // クラス名がconfirmationの要素
        By.xpath("//div[contains(@id, 'confirm')]"), // idにconfirmationを含むdiv
      ];

      for (const selector of confirmationSelectors) {
        const elements = await driver.findElements(selector);
        if (elements.length > 0) {
          console.log('確認画面が表示されています。');
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error(`確認画面検出中にエラーが発生しました:`, error);
      try {
        // エラー発生時にも元のコンテキストに戻す
        await driver.switchTo().defaultContent();
      } catch (switchError) {
        console.error(
          `元のコンテキストに戻す際にエラーが発生しました:`,
          switchError,
        );
      }
      return true;
    }
  }

  /**
   * 送信完了画面が表示されているかを検出します。
   * 送信完了画面の特定の要素やテキストを基に判定します。
   * @param driver Selenium WebDriverのインスタンス
   * @returns 送信完了画面が表示されていればtrue、そうでなければfalse
   */
  async isSendCompleteScreenDisplayed(driver: WebDriver): Promise<boolean> {
    try {
      // 1. すべてのiframeを取得
      const iframes: WebElement[] = await driver.findElements(
        By.tagName('iframe'),
      );
      console.log(`見つかったiframeの数: ${iframes.length}`);

      if (iframes.length > 0) {
        // 2. 各iframeを順番にチェック
        for (let i = 0; i < iframes.length; i++) {
          try {
            // iframeに切り替える
            await driver.switchTo().frame(iframes[i]);
            console.log(`iframe #${i + 1} に切り替えました。`);

            // 送信完了画面を探すためのセレクターを複数試みます
            const iframeSendCompleteSelectors: By[] = [
              By.xpath("//*[contains(text(), '送信完了')]"),
              By.xpath("//*[contains(text(), '送信が完了')]"),
              By.xpath("//*[contains(text(), 'ありがとうございます')]"),
              By.xpath("//*[contains(text(), 'ありがとうございました')]"),
              By.xpath("//*[contains(text(), 'しばらくお待ち')]"),
              By.xpath("//*[contains(text(), '担当者よりご連絡')]"),
              By.xpath("//*[contains(text(), '担当者より連絡')]"),
              By.xpath("//*[contains(text(), '担当者がご連絡')]"),
              By.xpath("//*[contains(text(), '担当者が連絡')]"),
              By.xpath("//*[contains(text(), 'トップページに戻る')]"),
              By.xpath("//*[contains(text(), 'TOPページに戻る')]"),
              By.css('.send-complete'), // クラス名がsend-completeの要素
              By.css('.complete'), // クラス名がsend-completeの要素
              By.xpath("//div[contains(@id, 'sendComplete')]"), // idにsendCompleteを含むdiv
            ];

            for (const selector of iframeSendCompleteSelectors) {
              const elements = await driver.findElements(selector);
              if (elements.length > 0) {
                console.log('送信完了画面が表示されています。');
                return true;
              }
            }

            // 入力項目エラーが見つからなかった場合、元のコンテキストに戻る
            await driver.switchTo().defaultContent();
          } catch (iframeError) {
            console.error(
              `iframe #${i + 1} の処理中にエラーが発生しました。`,
              iframeError,
            );
            // エラーが発生した場合でも元のコンテキストに戻る
            await driver.switchTo().defaultContent();
            continue;
          }
        }
      }

      // iframe内で送信完了画面が見つからなかった場合、メインコンテンツでも探す
      console.log(
        `iframe内で送信完了画面が見つからなかったため、メインコンテンツをチェックします。`,
      );
      const sendCompleteSelectors: By[] = [
        By.xpath("//*[contains(text(), '送信完了')]"),
        By.xpath("//*[contains(text(), '送信が完了')]"),
        By.xpath("//*[contains(text(), 'ありがとうございます')]"),
        By.xpath("//*[contains(text(), 'ありがとうございました')]"),
        By.xpath("//*[contains(text(), 'しばらくお待ち')]"),
        By.xpath("//*[contains(text(), '担当者よりご連絡')]"),
        By.xpath("//*[contains(text(), '担当者より連絡')]"),
        By.xpath("//*[contains(text(), '担当者がご連絡')]"),
        By.xpath("//*[contains(text(), '担当者が連絡')]"),
        By.xpath("//*[contains(text(), 'トップページに戻る')]"),
        By.xpath("//*[contains(text(), 'TOPページに戻る')]"),
        By.css('.send-complete'), // クラス名がsend-completeの要素
        By.css('.complete'), // クラス名がsend-completeの要素
        By.xpath("//div[contains(@id, 'sendComplete')]"), // idにsendCompleteを含むdiv
      ];

      for (const selector of sendCompleteSelectors) {
        const elements = await driver.findElements(selector);
        if (elements.length > 0) {
          console.log('送信完了画面が表示されています。');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error(`送信完了画面検出中にエラーが発生しました:`, error);
      try {
        // エラー発生時にも元のコンテキストに戻す
        await driver.switchTo().defaultContent();
      } catch (switchError) {
        console.error(
          `元のコンテキストに戻す際にエラーが発生しました:`,
          switchError,
        );
      }
      return false;
    }
  }

  /**
   * サイトのキャッシュクリアを行います
   *
   * @param driver Selenium WebDriverのインスタンス
   */
  async clearCache(driver: WebDriver): Promise<void> {
    try {
      // すべてのクッキーを削除
      await driver.manage().deleteAllCookies();
      // ローカルストレージとセッションストレージをクリア
      await driver.executeScript('window.localStorage.clear();');
      await driver.executeScript('window.sessionStorage.clear();');
      console.log('キャッシュとストレージをクリアしました。');
    } catch (error) {
      console.error('キャッシュクリア中にエラーが発生しました:', error);
    }
  }
}
