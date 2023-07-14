import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  expression: `select sl.sales_list_number,count(case when st.execute_small_result = 'SR01' then 1 end) as SR01,
  count(case when st.execute_small_result = 'SR02' then 1 end) as SR02,
  count(case when st.execute_small_result = 'SR03' then 1 end) as SR03,
  count(case when st.execute_small_result = 'SR04' then 1 end) as SR04,
  count(case when st.execute_small_result = 'SR05' then 1 end) as SR05,
  count(case when st.execute_small_result = 'SR06' then 1 end) as SR06,
  count(case when st.execute_small_result = 'SR07' then 1 end) as SR07,
  count(case when st.execute_small_result = 'SR08' then 1 end) as SR08,
  count(case when st.execute_small_result = 'SR09' then 1 end) as SR09,
  count(case when st.execute_small_result = 'SR10' then 1 end) as SR10,
  count(case when st.execute_small_result = 'SR11' then 1 end) as SR11,
  count(case when st.execute_small_result = 'SR12' then 1 end) as SR12,
  count(case when st.execute_small_result = 'SR13' then 1 end) as SR13,
  count(case when st.execute_small_result = 'SR14' then 1 end) as SR14,
  count(case when st.execute_small_result = 'SR15' then 1 end) as SR15,
  count(case when st.execute_small_result = 'SR16' then 1 end) as SR16,
  count(case when st.execute_small_result = 'SR17' then 1 end) as SR17,
  count(case when st.execute_small_result = 'SR18' then 1 end) as SR18,
  count(case when st.execute_small_result = 'SR19' then 1 end) as SR19,
  count(case when st.execute_small_result = 'SR20' then 1 end) as SR20,
  count(case when st.execute_small_result = 'SR21' then 1 end) as SR21,
  from tb_sales_task st left join tb_sales_list sl ON st.sales_list_number = sl.sales_list_number
  GROUP BY sl.sales_list_number;`,
})
export class SmallResult {
  @ViewColumn()
  sales_list_number: number;
  @ViewColumn()
  SR01: number;
  @ViewColumn()
  SR02: number;
  @ViewColumn()
  SR03: number;
  @ViewColumn()
  SR04: number;
  @ViewColumn()
  SR05: number;
  @ViewColumn()
  SR06: number;
  @ViewColumn()
  SR07: number;
  @ViewColumn()
  SR08: number;
  @ViewColumn()
  SR09: number;
  @ViewColumn()
  SR10: number;
  @ViewColumn()
  SR11: number;
  @ViewColumn()
  SR12: number;
  @ViewColumn()
  SR13: number;
  @ViewColumn()
  SR14: number;
  @ViewColumn()
  SR15: number;
  @ViewColumn()
  SR16: number;
  @ViewColumn()
  SR17: number;
  @ViewColumn()
  SR18: number;
  @ViewColumn()
  SR19: number;
  @ViewColumn()
  SR20: number;
  @ViewColumn()
  SR21: number;
}
