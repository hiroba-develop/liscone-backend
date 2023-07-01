<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).

  
## 1. ダッシュボード my task(tb_my_sales_task) CRUD & Search   
1. my task : GET http://localhost:3001/membersalestasks 
2. my task param (member_id and task_number) : GET http://localhost:3001/membersalestasks/search    
* body sample :   
  member_id : optional  
  assign_from_date : essential  
  assign_to_date : essential  
  status : optional  
  ```
  {
    "member_id": "sjstomato@gmail.com",
    "assign_from_date":"20230622",
    "assign_to_date":"20230629",
    "status": "CODE-801"
  }
  ```  

3. my task add : POST http://localhost:3001/membersalestasks  
* body sample :
  ```
   {
    "member_id": "sjstomato@gmail.com",
    "task_number": "00001",
    "assign_date": "20230622",
    "assign_confirm": "20230622",
    "created_by": "admin",
    "modified_by": "admin"
  }
  ```

4. my task update : PATCH http://localhost:3001/membersalestasks
  
* body sample :  
  member_id and task_number is update key
  ```
  {
    "member_id": "sjstomato@gmail.com",
    "task_number": "00001",
    "assign_date": "20230622",
    "assign_confirm": "일하세요001",
    "created_by": "admin",
    "modified_by": "admin"
  }
  ```

5. my task delete : PATCH http://localhost:3001/membersalestasks
  
* body sample :  
  member_id and task_number is key
  ```
  {
    "member_id": "sjstomato@gmail.com",
    "task_number": "00001"
  }
  ```

## 2. 企業リスト作成 CORPORATION(tb_corporation) CRUD & Search   

1. corporation all : GET http://localhost:3001/corporations  
2. corporation search : GET http://localhost:3001/corporations/search    
* body sample :   
  all : optional
  address : like search
  ```
  {
    "corporate_number": "123-0000",
    "corporation_name": "株式会社AAAAA",
    "business_category": "IT",
    "address": "東京都港区南麻布",
    "representative_phone_number": "02-000-0001",
    "sales_from_amount": "10000",
    "sales_to_amount": "10000",
    "capital_from_stock": "100",
    "capital_to_stock": "100",
    "employee_from_number": "10",
    "employee_to_number": "1000",
    "establishment_from_year": "1997",
    "establishment_to_year": "1997",
    "listing_status": "Y"
  }
  ```  

3. corporation name : GET http://localhost:3001/corporations/name  
* body sample : 
  ```
  { "corporation_name": "株式会社AAAAA" }
  ```

4. corporation add : POST http://localhost:3001/corporations  
* body sample :
  ```
   {
    "corporation_id": "000-0000-001",
    "corporation_name": "株式会社AAAAA",
    "corporate_number": "123-4567",
    "address": "東京都港区南麻布1-2-3 麻布オフィスビル1F",
    "business_category": "IT",
    "capital_stock": "100万円",
    "employee_number": "100名",
    "establishment_year": "1997",
    "home_page": "http://example.co.jp",
    "listing_status": "上場",
    "created_by": "admin",
    "modified_by": "admin",
    "representative_name": "JUSIN-SEO",
    "representative_phone_number": "02-000-0001",
    "sales_amount": "10000",
    "zip_code": "011-070" 
  }
  ```

5. corporation update : PATCH http://localhost:3001/corporations
  
* body sample :  
  corporation_id is update key.
  ```
  {
    "corporation_id": "000-0000-001",
    "corporation_name": "株式会社AAAAA",
    "corporate_number": "123-0000",
    "address": "東京都港区南麻布1-2-3 麻布オフィスビル1F",
    "business_category": "IT",
    "capital_stock": "100万円",
    "employee_number": "100名",
    "establishment_year": "1997",
    "home_page": "http://example.co.jp",
    "listing_status": "上場",
    "created_by": "admin",
    "modified_by": "admin",
    "representative_name": "JUSIN-SEO",
    "representative_phone_number": "02-000-0001",
    "sales_amount": "10000",
    "zip_code": "011-070" 
  }
  ```

## 3. 担当者リスト作成 COMPANY STAFF (tb_company_staff) CRUD & Search  

1. companystaffs all : GET http://localhost:3001/companystaffs   

2. companystaffs search : GET http://localhost:3001/companystaffs/search  
* body sample :   
  all : optional  
  staff_name : like search  
  corporation_name : like search    
  ```
  {
	  "staff_id": "STFF_000_002",
    "staff_name": "csm0222",
    "job_position": "01",
    "profile_source_type": "LinkedIn",
    "employee_from_number": "0",
    "employee_to_number": "1000000",
    "corporation_name": "AAAA"
  }
  ```  

3. companystaffs add : POST http://localhost:3001/companystaffs  
* body sample :
  ```
   {
    "staff_id": "STFF_000_002",
    "corporation_id": "0000000003" ,
    "staff_name": "csm0222@gmail.com" ,
    "job_position": "02" ,
    "profile_source_type": "LinkedIn" ,
    "profile_link": "www.linkedin.com/csm0222" ,
    "other_information": "etc info" ,
    "modified_by": "admin"
  }
  ```

4. companystaffs update : PATCH http://localhost:3001/companystaffs
* body sample :  
  staff_id and corporation_id are update key.
  ```
  {
    "staff_id": "STFF_000_002",
    "corporation_id": "0000000002" ,
    "staff_name": "csm0222@gmail.com" ,
    "job_position": "01" ,
    "profile_source_type": "LinkedIn" ,
    "profile_link": "www.linkedin.com/csm0222" ,
    "other_information": "etc info" ,
    "modified_by": "admin"
  }

5. companystaffs delete : DELETE http://localhost:3001/companystaffs
* body sample :  
  staff_id and corporation_id are delete key.
  ```
  {
    "staff_id": "STFF_000_002",
    "corporation_id": "0000000003"
  }
  ```

## 6. 行動ログ action log (tb_sales_task) CRUD & Search  

1. actionlogs all : GET http://localhost:3001/actionlogs   

2. actionlogs search : GET http://localhost:3001/actionlogs/search  
* body sample :   
  all : optional  

  member_id : like search  
  execute_major_result : like search   
  execute_minor_result : like search   

  corporation_name : like search   
  corporate_number : like search   
  sales_list_name : like search   
  staff_name : like search    
  member_name : like search    
  ```
  {
      "corporation_name": "AAAA01",
      "corporate_number": "0000000001",
      "sales_list_name": "Project01",
      "staff_name": "sjstomato@gmail.com",
      "member_name":"SEONGMINCHOI",
      "execute_major_result":"A001",
      "execute_minor_result":"Z001",
      "execute_from_date": "20230701",
      "execute_to_date": "20230730"
  }
  ```  

3. actionlogs add : POST http://localhost:3001/actionlogs 
* body sample :
  ```
  {
    "task_number": "00002",
    "member_id": "csm0222@gmail.com",
    "sales_list_number": "SAL-000-0002",
    "task_name": "meeting",
    "sales_target": "0000000002",
    "deadline": "20230730",
    "execute_date": "20230702",
    "execute_result": "A002Z002",
    "comment": "action log comments... ",
    "status": "STAT_002",
    "created_by": "admin",
    "modified_by": "admin"
  }
  ```

4. actionlogs update : PATCH http://localhost:3001/actionlogs
* body sample :  
  task_number and member_id are update key.
  ```
  {
    "task_number": "00002",
      "member_id": "csm0222@gmail.com",
      "sales_list_number": "SAL-000-0001",
      "task_name": "meeting1",
      "sales_target": "0000000001",
      "deadline": "20230620",
      "execute_date": "20230601",
      "execute_result": "A001Z001",
      "comment": "action log comments1... ",
      "status": "STAT_001",
      "modified_by": "admin"
  }

5. actionlogs delete : DELETE http://localhost:3001/actionlogs
* body sample :  
  task_number and member_id are delete key.
  ```
  {
	  "task_number": "00002",
    "member_id": "csm0222@gmail.com"
  }
  ```

  
## ETC. MEMBER CRUD Test   
1. members all : GET http://localhost:3001/members   
2. members id : GET http://localhost:3001/members/id    
* body sample 1 : 
  ```
  { "member_id": "sjstomato@gmail.com" }
  ```  
* body sample 2 : 
  ```
  { "member_id": "csm0222@gmail.com" }
  ```  

3. members name : GET http://localhost:3001/members/name  
* body sample 1 : 
  ```
  { "member_name": "JUSHINSEO" }
  ```
* body sample 2 : 
  ```
  { "member_name": "SEONGMINCHOI" }
  ```  

4. member add : POST http://localhost:3001/members  
* body sample :
  ```
  {
    "member_id": "csm0222@gmail.com",
    "company_code": "000000",
    "member_name": "SEONGMINCHOI",
    "password": "encrypt",
    "dormant_status": "N",
    "password_expired_day": 19000101,
    "created_by": "admin",
    "modified_by": "admin"
  }
  ```

5. member update : PATCH http://localhost:3001/members
  
* body sample :  
  member_id is update key.
  ```
  {
    "member_id": "csm0222@gmail.com",
    "company_code": "000002",
    "member_name": "SEONGMINCHOI",
    "password": "encrypt",
    "dormant_status": "N",
    "password_expired_day": 19000101
  }
  ```
