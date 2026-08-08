// Everafter 문의 폼 처리 — Google Apps Script
//
// 이 파일은 실행되지 않는 보관용 사본입니다. 실제로 동작하게 하려면
// Google Sheet에 연결된 Apps Script 프로젝트에 이 내용을 붙여넣고
// 웹 앱으로 배포해야 합니다. 절차는 이 폴더의 README.md를 참고하세요.

const NOTIFY_EMAIL = 'juhyeonjeon.lina@gmail.com';
const SHEET_NAME = '문의';
const HEADER_ROW = ['접수 시각', '두 사람의 이름', '예식 날짜', '예식 장소', '연락처', '남기고 싶은 이야기', '상태'];

function doPost(e) {
  try {
    const p = e.parameter;

    // 허니팟 필드: 사람 눈에는 안 보이는 입력칸이라, 값이 채워져 있으면 봇으로 간주하고 조용히 무시.
    if (p.website) {
      return ContentService.createTextOutput('ok');
    }

    const sheet = getOrCreateSheet();
    sheet.appendRow([
      new Date(),
      p.names || '',
      p.date || '',
      p.venue || '',
      p.contactInfo || '',
      p.message || '',
      '신규'
    ]);

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: `[Everafter 문의] ${p.names || '이름 미기재'} · ${p.date || '날짜 미기재'}`,
      body: [
        '새로운 사회 문의가 도착했습니다.',
        '',
        `두 사람의 이름: ${p.names || ''}`,
        `예식 날짜: ${p.date || ''}`,
        `예식 장소: ${p.venue || ''}`,
        `연락처: ${p.contactInfo || ''}`,
        `남기고 싶은 이야기: ${p.message || '(없음)'}`,
        '',
        '전체 목록은 연결된 Google Sheet에서 확인하고, 상태 열을 직접 수정해 관리할 수 있습니다.'
      ].join('\n')
    });

    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error: ' + err.message);
  }
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER_ROW);
  }
  return sheet;
}
