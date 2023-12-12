# DATA FILE

## Data file names 
* Cleaned_covid.csv 
* Lower_Secondary.csv
* OOS_Rates_clean.csv
* Primary_demographics.csv
* Unesco_school_closure.csv
* World--10m.json 

## Cleaned_covid.csv  
* Date: Ranging from February 2020 to March 2022 
* Academic_Break: Binary for whether schools were on academic (i.e Summer break)
* Closed: Number of countries with schools closed for a given date
* Fully_Open:  Number of countries with schools opened for a given date
* Partially_Open:  Number of countries with schools partially opened for a given date
* Total: Sum of Fully_Opened, Partially_Opened and Closed

## Lower_Secondary.csv
* ISO3: Three-digit alphabetical codes International Standard ISO 3166-1 assigned by the International Organization for Standardization (ISO). For example, Belgium is BEL. 
* Countries and Areas: Country Name
* Region: Region Name
* Sub-region: Sub Region Name
* Development Regions: Economies are currently divided into four income groupings: low, lower-middle, upper-middle, and high and accordingly countries are classified
* Total: Total % of children who were out of schools
* Female: % of Female who were out of schools
* Male: % of Male who were out of schools
* Rural_Residence: % of children who were out of school and were residing in Rural area
* Urban_Residence: % of children who were out of school and were residing in Urban Area
* Poorest_Wealth quintile: Poorest indicates % of children that fall in the Poorest Wealth quintile
* Second_Wealth quintile: Second Richest indicates % of children that fall in the Second Richest Wealth quintile
* Middle_Wealth quintile: Middle indicates % of children that fall in the Middle strata of Wealth quintile
* Fourth_Wealth quintile: Fourth Richest % of children that fall in the fourth strata of Wealth quintile
* Richest_Wealth quintile: Richest indicates % of children that fall in the Richest strata of Wealth quintile
* Time period: Represents the year(s) in which the data collection (e.g. survey interviews) took place.


## OOS_Rates_clean.csv
* name: Country name
* country: ISO, 3-letter abbreviation for country name
* level: Schooling level 
* sex: Aggregated male and female
* year: year
* value: Out-of-school rates 
* lower: Lower confidence bound (95%) 
* upper: Upper confidence bound (95%) 

## Primary_demographics.csv
* Region: region abbrevation
* Male: average male out-of-school rates 
* Female: average female out-of-school rates 
* Rural: average rural out-of-school rates 
* Urban: average urban out-of-school rates 



## Unesco_school_closure.csv

* Date: Reference date 
* Country ID: Country ISO Alpha-3 cod 
* Country: Country name (English)
* Region Type 1: This attribute will not be used, every entry has the value “EC” which stands for United Nations Economic Commission
* Region 1: United Nations Economic Commission regional grouping, for example ECLAC: Latin America and the Caribbean
* Region Type 2: Sustainable Development Goals regional grouping
* Region 2: Sustainable Development Goals regional grouping, for example, SDG: Latin America and the Caribbean
* Region Type 3: Sustainable Development Goals Regional grouping 
* Region 3:  World Bank country income grouping
* Status: Status of school closures
* Enrollment (Pre-Primary to Upper Secondary): Number of students enrolled in pre-primary and upper secondary
* Teachers (Pre-Primary to Upper Secondary): Number of teachers in pre-primary and upper secondary
* School Age Population: School Age Population (Pre-Primary to Upper Secondary)
* Distance learning modalities (TV): Existence of distance learning modalities (TV) in the country
* Distance learning modalities (Radio): Existence of distance learning modalities (Radio) in the country
* Distance learning modalities (Online): Existence of distance learning modalities (Online) in the country
* Distance learning modalities (Global): Existence of distance learning modalities (combination of TV+Radio+Online) in the country
* Weeks partially open: Weeks partially open
* Weeks fully closed: Number of weeks schools were closed
 

## World--10m.json  
* Data with every countries' longitute, latitude, and arcs to build the globe
