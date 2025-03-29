const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// 정적 파일 서빙
app.use(express.static('.'));

// 서버 시작
app.listen(port, () => {
  console.log(`Yacht Dice app listening at http://localhost:${port}`);
});