import React from "react";
import './CodeConvertor.css'

const CodeConverter = () => {
  return (
    <section className="code-converter" id="homepage-code-convertor">
      {/* Title and Subtitle */}
      <div className="converter-header">
        <h1>Interactive Code Converter</h1>
        <p>Try our converter with a simple SQL query</p>
      </div>

      {/* Code Blocks Section */}
      <div className="code-blocks">
        {/* SQL Input Block */}
        <div className="code-block">
          <h3>SQL Input</h3>
          <pre className="code-convertor-content">
            {`SELECT customer_id,
       SUM(order_amount) as total_amount
FROM orders
WHERE order_date >= '2023-01-01'
GROUP BY customer_id
HAVING SUM(order_amount) > 1000
ORDER BY total_amount DESC;`}
          </pre>
        </div>

        {/* PySpark Output Block */}
        <div className="code-block">
          <h3>PySpark Output</h3>
          <pre className="code-convertor-content" style={{color:"#3eb63e"}}>
            {`from pyspark.sql.functions import *

df = spark.table("orders")
result = df.filter(col("order_date") >= "2023-01-01") \\
           .groupBy("customer_id") \\
           .agg(sum("order_amount").alias("total_amount")) \\
           .filter(col("total_amount") > 1000) \\
           .orderBy(col("total_amount").desc())`}
          </pre>
        </div>
      </div>
    </section>
  );
};

export default CodeConverter;
