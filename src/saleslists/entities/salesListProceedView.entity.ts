import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  expression: `SELECT 
  sl.sales_list_number AS sales_list_number,
  sl.sales_list_name AS sales_list_name,
  sl.created AS created,
  (CASE
      WHEN (sl.sales_list_type = '01') THEN COUNT(sc.corporation_id)
      ELSE COUNT(scs.corporation_id)
  END) AS listCount,
  (CASE
      WHEN
          (sl.sales_list_type = '01')
      THEN
          COUNT((CASE
              WHEN (sc.transaction_status IN ('TR01' , 'TR02', 'TR03', 'TR04', 'TR05', 'TR06')) THEN 1
          END))
      ELSE COUNT((CASE
          WHEN (scs.transaction_status IN ('TR01' , 'TR02', 'TR03', 'TR04', 'TR05', 'TR06')) THEN 1
      END))
  END) AS proceedCount,
  tm.member_id AS member_id,
  tm.member_name AS member_name
FROM
  ((((tb_sales_list sl
  LEFT JOIN tb_sales_corporation sc ON ((sc.sales_list_number = sl.sales_list_number)))
  LEFT JOIN tb_sales_corporation_staff scs ON ((scs.sales_list_number = sl.sales_list_number)))
  LEFT JOIN tb_member tm ON ((tm.member_id = sl.member_id))))
GROUP BY sl.sales_list_number;`,
})
export class SalesListProceed {
  @ViewColumn()
  sales_list_number: number;

  @ViewColumn()
  created: string;

  @ViewColumn()
  sales_list_name: string;
  @ViewColumn()
  listCount: number;

  @ViewColumn()
  proceedCount: number;

  @ViewColumn()
  member_id: string;

  @ViewColumn()
  member_name: string;
}
