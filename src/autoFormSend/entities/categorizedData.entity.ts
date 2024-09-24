import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Categories {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('simple-array', { nullable: true })
  departments: any[];

  @Column('simple-array', { nullable: true })
  positions: any[];

  @Column('simple-array', { nullable: true })
  email_addresses: any[];

  @Column('simple-array', { nullable: true })
  phone_numbers: any[];

  @Column('simple-array', { nullable: true })
  fax_numbers: any[];

  @Column('simple-array', { nullable: true })
  mobile_numbers: any[];

  @Column('simple-array', { nullable: true })
  company_names: any[];

  @Column('simple-array', { nullable: true })
  employee_sizes: any[];

  @Column('simple-array', { nullable: true })
  inquiry_contents: any[];

  @Column('simple-array', { nullable: true })
  inquiry_genre: any[];

  @Column('simple-array', { nullable: true })
  address: any[];

  @Column('simple-array', { nullable: true })
  address_zip: any[];

  @Column('simple-array', { nullable: true })
  address_prefecture: any[];

  @Column('simple-array', { nullable: true })
  address_city: any[];

  @Column('simple-array', { nullable: true })
  address_street: any[];

  @Column('simple-array', { nullable: true })
  post_code: any[];

  @Column('simple-array', { nullable: true })
  url: any[];

  @Column('simple-array', { nullable: true })
  industry: any[];

  @Column('simple-array', { nullable: true })
  how_found: any[];

  @Column('simple-array', { nullable: true })
  introduction_time: any[];

  @Column('simple-array', { nullable: true })
  name: any[];

  @Column('simple-array', { nullable: true })
  kana: any[];

  @Column('simple-array', { nullable: true })
  hiragana: any[];

  @Column('simple-array', { nullable: true })
  hiragana_sei: any[];

  @Column('simple-array', { nullable: true })
  hiragana_mei: any[];

  @Column('simple-array', { nullable: true })
  hiragana_fullname: any[];

  @Column('simple-array', { nullable: true })
  katakana: any[];

  @Column('simple-array', { nullable: true })
  katakana_sei: any[];

  @Column('simple-array', { nullable: true })
  katakana_mei: any[];

  @Column('simple-array', { nullable: true })
  katakana_fullname: any[];

  @Column('simple-array', { nullable: true })
  kanji: any[];

  @Column('simple-array', { nullable: true })
  kanji_sei: any[];

  @Column('simple-array', { nullable: true })
  kanji_mei: any[];

  @Column('simple-array', { nullable: true })
  kanji_fullname: any[];
}

export class ExtractedData  {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  element_name: string;

  @Column()
  element_value: string;

  @Column()
  element_text: string;
  
  @Column()
  parent_text: string;
  
  @Column()
  siblings_text: string;
  
  @Column()
  class_name: string;
  
  @Column()
  label_text: string;
  
  @Column()
  element_type: string;
  
  @Column()
  tr_text: string;
  
  @Column()
  category: string;
}