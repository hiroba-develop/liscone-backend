import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  expression: `select sl.sales_list_number,sacount(case when st.execute_big_result = 'BR01' then 1 end) as BR01,
  count(case when st.execute_big_result = 'BR02' then 1 end) as BR02,
  count(case when st.execute_big_result = 'BR03' then 1 end) as BR03,
  count(case when st.execute_big_result = 'BR04' then 1 end) as BR04,
  count(case when st.execute_big_result = 'BR05' then 1 end) as BR05
  from tb_sales_task st left join tb_sales_list sl ON st.sales_list_number = sl.sales_list_number
  GROUP BY sl.sales_list_number;`,
})
export class BigResult {
  @ViewColumn()
  sales_list_number: number;
  @ViewColumn()
  BR01: number;
  @ViewColumn()
  BR02: number;
  @ViewColumn()
  BR03: number;
  @ViewColumn()
  BR04: number;
  @ViewColumn()
  BR05: number;
}
