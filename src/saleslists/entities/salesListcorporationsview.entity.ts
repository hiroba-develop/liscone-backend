import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  expression: `SELECT 
  sl.sales_list_number,
  tc.corporation_id,
  tc.corporate_number,
  tc.corporation_name,
  tc.business_category,
  tc.zip_code,
  tc.address,
  tc.representative_phone_number,
  tc.representative_name,
  tc.home_page,
  tc.sales_amount,
  tc.employee_number,
  tc.establishment_year,
  tc.capital_stock,
  tc.listing_status,
  sc.transaction_status,
  COUNT(st.task_number) taskCount
FROM
  tb_corporation tc
      LEFT JOIN
  tb_sales_corporation sc ON sc.corporation_id = tc.corporation_id
      LEFT JOIN
  tb_sales_list sl ON sl.sales_list_number = sc.sales_list_number
      LEFT JOIN
  tb_sales_task st ON st.sales_list_number = sl.sales_list_number
      AND st.sales_corporation_id = sc.corporation_id
GROUP BY tc.corporation_id, sc.sales_list_number;
`,
})
export class SalesListCorporations {
  @ViewColumn()
  sales_list_number: number;
  @ViewColumn()
  corporation_id: string;
  @ViewColumn()
  corporate_number: string;

  @ViewColumn()
  corporation_name: string;
  @ViewColumn()
  business_category: string;
  @ViewColumn()
  zip_code: string;
  @ViewColumn()
  address: string;
  @ViewColumn()
  representative_phone_number: string;
  @ViewColumn()
  representative_name: string;
  @ViewColumn()
  home_page: string;
  @ViewColumn()
  sales_amount: string;
  @ViewColumn()
  employee_number: string;
  @ViewColumn()
  establishment_year: string;
  @ViewColumn()
  capital_stock: string;
  @ViewColumn()
  listing_status: string;
  @ViewColumn()
  transaction_status: string;
  @ViewColumn()
  taskCount: string;
  static createQueryBuilder: any;
}
