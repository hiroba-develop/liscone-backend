import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  expression: `SELECT 
  sl.sales_list_number,
  sl.sales_list_name,
  CASE
      WHEN sl.sales_list_type = '01' THEN COUNT(sc.corporation_id)
      ELSE COUNT(scs.corporation_id)
  END AS listCount,
  CASE
      WHEN
          sl.sales_list_type = '01'
      THEN
          COUNT(CASE
              WHEN sc.transaction_status IN ('TR02' , 'TR03', 'TR04', 'TR05', 'TR06') THEN 1
          END)
      ELSE COUNT(CASE
          WHEN scs.transaction_status IN ('TR02' , 'TR03', 'TR04', 'TR05', 'TR06') THEN 1
      END)
  END AS proceedCount,
  CASE
      WHEN
          sl.sales_list_type = '01'
      THEN
          COUNT(CASE
              WHEN sc.transaction_status IN ('TR02' , 'TR03', 'TR04', 'TR05') THEN 1
          END)
      ELSE COUNT(CASE
          WHEN scs.transaction_status IN ('TR02' , 'TR03', 'TR04', 'TR05') THEN 1
      END)
  END AS progressCount,
  CASE
      WHEN
          sl.sales_list_type = '01'
      THEN
          COUNT(CASE
              WHEN sc.transaction_status IN ('TR02' , 'TR03', 'TR04') THEN 1
          END)
      ELSE COUNT(CASE
          WHEN scs.transaction_status IN ('TR02' , 'TR03', 'TR04') THEN 1
      END)
  END AS projectCount,
  CASE
      WHEN
          sl.sales_list_type = '01'
      THEN
          COUNT(CASE
              WHEN sc.transaction_status IN ('TR02') THEN 1
          END)
      ELSE COUNT(CASE
          WHEN scs.transaction_status IN ('TR02') THEN 1
      END)
  END AS contractCount,
  CASE
      WHEN
          sl.sales_list_type = '01'
      THEN
          SUM(CASE
              WHEN sc.transaction_status = 'TR02' THEN cp.product_price * 1
              ELSE CASE
                  WHEN sc.transaction_status = 'TR03' THEN cp.product_price * 0.9
                  ELSE CASE
                      WHEN sc.transaction_status = 'TR04' THEN cp.product_price * 0.5
                      ELSE CASE
                          WHEN sc.transaction_status = 'TR05' THEN cp.product_price * 0.2
                          ELSE CASE
                              WHEN sc.transaction_status = 'TR06' THEN cp.product_price * 0.1
                          END
                      END
                  END
              END
          END)
      ELSE SUM(CASE
          WHEN scs.transaction_status = 'TR02' THEN cp.product_price * 1
          ELSE CASE
              WHEN scs.transaction_status = 'TR03' THEN cp.product_price * 0.9
              ELSE CASE
                  WHEN scs.transaction_status = 'TR04' THEN cp.product_price * 0.5
                  ELSE CASE
                      WHEN scs.transaction_status = 'TR05' THEN cp.product_price * 0.2
                      ELSE CASE
                          WHEN scs.transaction_status = 'TR06' THEN cp.product_price * 0.1
                      END
                  END
              END
          END
      END)
  END AS expectSales,
  tm.member_name,
  sl.sales_list_type
FROM
  tb_sales_list sl
      LEFT JOIN
  tb_sales_corporation sc ON sc.sales_list_number = sl.sales_list_number
      LEFT JOIN
  tb_sales_corporation_staff scs ON scs.sales_list_number = sl.sales_list_number
      LEFT JOIN
  tb_member_company_product cp ON cp.product_number = sl.sales_product_number
      LEFT JOIN
  tb_member tm ON tm.member_id = sl.member_id
GROUP BY sl.sales_list_number;`,
})
export class SalesListStatistics {
  @ViewColumn()
  sales_list_number: number;
  @ViewColumn()
  sales_list_name: string;
  @ViewColumn()
  listCount: number;

  @ViewColumn()
  proceedCount: number;
  @ViewColumn()
  projectCount: number;
  @ViewColumn()
  contractCount: number;
  @ViewColumn()
  expectSales: number;
  @ViewColumn()
  member_name: string;
  @ViewColumn()
  sales_list_type: string;
}
