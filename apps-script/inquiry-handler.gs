// Everafter 문의 폼 처리 — Google Apps Script
//
// 이 파일은 실행되지 않는 보관용 사본입니다. 실제로 동작하게 하려면
// Google Sheet에 연결된 Apps Script 프로젝트에 이 내용을 붙여넣고
// 웹 앱으로 배포해야 합니다. 절차는 이 폴더의 README.md를 참고하세요.

const NOTIFY_EMAIL = 'juhyeonjeon.lina@gmail.com';
const SHEET_NAME = '문의';
const HEADER_ROW = ['접수 시각', '두 사람의 이름', '예식 날짜', '예식 장소', '연락처', '남기고 싶은 이야기', '상태'];

// ---------- 관리자 인증 ----------
// wedding-mc 관리자 도구가 문의 목록을 읽고 상태를 바꾸려면 이 값을 알아야 합니다.
// 왼쪽 톱니바퀴 → 프로젝트 설정 → 스크립트 속성에서 ADMIN_TOKEN을 추가하세요.
// wedding-mc 쪽 관리자 토큰과 반드시 같은 값으로 맞춰야 합니다.
function getAdminToken_() {
  return String(PropertiesService.getScriptProperties().getProperty('ADMIN_TOKEN') || '');
}
function isAdmin_(token) {
  const real = getAdminToken_();
  return !!real && String(token || '') === real;
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function parseJsonSafe_(text) {
  try { return JSON.parse(text); } catch (e) { return null; }
}

function doPost(e) {
  try {
    // wedding-mc 관리자 도구에서 오는 요청은 JSON 본문(Content-Type: text/plain)으로 옵니다.
    // 홈페이지 문의 폼은 일반 폼 제출(e.parameter)로 오므로 이 분기에 걸리지 않습니다.
    if (e.postData && e.postData.type === 'text/plain') {
      const data = parseJsonSafe_(e.postData.contents);
      if (data && data.type === 'updateStatus') {
        if (!isAdmin_(data.token)) return json_({ ok: false, error: 'unauthorized' });
        const row = Number(data.row);
        if (!row || row < 2) throw new Error('row is required');
        getOrCreateSheet().getRange(row, 7).setValue(String(data.status || '신규'));
        return json_({ ok: true });
      }
    }

    // 홈페이지 문의 폼 제출 (공개 · 인증 없음)
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
        '전체 목록은 연결된 Google Sheet에서 확인하거나, wedding-mc 관리자 도구의 대시보드에서도 볼 수 있습니다.'
      ].join('\n')
    });

    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error: ' + err.message);
  }
}

function doGet(e) {
  try {
    const p = e.parameter || {};
    // wedding-mc 대시보드용 문의 목록 (관리자 전용)
    if (p.inquiries) {
      if (!isAdmin_(p.token)) return json_({ ok: false, error: 'unauthorized' });
      const rows = getOrCreateSheet().getDataRange().getValues();
      const items = [];
      for (let i = 1; i < rows.length; i++) {
        items.push({
          row: i + 1,
          receivedAt: rows[i][0],
          names: rows[i][1],
          date: rows[i][2],
          venue: rows[i][3],
          contactInfo: rows[i][4],
          message: rows[i][5],
          status: rows[i][6]
        });
      }
      items.reverse();
      return json_({ ok: true, items: items });
    }
    return json_({ ok: false, error: 'unknown request' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
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
