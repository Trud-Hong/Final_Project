import React, { useEffect, useState } from "react";
import axios from "axios";

const MongoTestPage = () => {
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8080/mongo/all")
      .then(res => setDocs(res.data))
      .catch(err => console.error(err));
  }, []);

  const saveDoc = () => {
    axios.get("http://localhost:8080/mongo/save")
      .then(res => {
        console.log(res.data);
        // 저장 후 전체 조회
        return axios.get("http://localhost:8080/mongo/all");
      })
      .then(res => setDocs(res.data))
      .catch(err => console.error(err));
  };

  return (
    <div>
      <h2>MongoDB Docs</h2>
      <button onClick={saveDoc}>샘플 저장</button>
      <ul>
        {docs.map(doc => (
          <li key={doc.id}>{doc.message}</li>
        ))}
      </ul>
    </div>
  );
};

export default MongoTestPage;
