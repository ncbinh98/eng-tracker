/**
 * ENG_CORE Backend v2
 * Supports multi-sheet storage for Books and Progress
 */

const SHEET_BOOKS = "books";
const SHEET_PROGRESS = "progress";

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName(SHEET_BOOKS)) {
    ss.insertSheet(SHEET_BOOKS).appendRow(["id", "title", "units"]);
  }
  if (!ss.getSheetByName(SHEET_PROGRESS)) {
    ss.insertSheet(SHEET_PROGRESS).appendRow(["date", "bookId", "unitNumber"]);
  }
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const booksSheet = ss.getSheetByName(SHEET_BOOKS);
    const progressSheet = ss.getSheetByName(SHEET_PROGRESS);

    // Get Books
    const booksData = booksSheet.getDataRange().getValues();
    const bookHeaders = booksData.shift();
    const books = booksData.map((row, index) => {
      const obj = {};
      bookHeaders.forEach((h, i) => (obj[h.toLowerCase()] = row[i]));
      return obj;
    });

    // Get Progress
    const progressData = progressSheet.getDataRange().getValues();
    const progressHeaders = progressData.shift();
    const progress = progressData.map((row) => {
      const obj = {};
      progressHeaders.forEach((h, i) => (obj[h.toLowerCase()] = row[i]));
      return obj;
    });

    return createResponse({ books, progress });
  } catch (error) {
    return createResponse({ error: error.toString() }, 500);
  }
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // --- BOOK ACTIONS ---
    if (action === "create_book") {
      const sheet = ss.getSheetByName(SHEET_BOOKS);
      const id = Utilities.getUuid();
      sheet.appendRow([id, params.title, params.units]);
      return createResponse({ status: "success", id });
    }

    if (action === "delete_book") {
      const sheet = ss.getSheetByName(SHEET_BOOKS);
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] == params.id) {
          sheet.deleteRow(i + 1);
          return createResponse({ status: "success" });
        }
      }
    }

    // --- PROGRESS ACTIONS ---
    if (action === "check_in") {
      const sheet = ss.getSheetByName(SHEET_PROGRESS);
      const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      sheet.appendRow([date, params.bookId, params.unitNumber]);
      return createResponse({ status: "success" });
    }

    return createResponse({ status: "error", message: "Invalid action" }, 400);
  } catch (error) {
    return createResponse({ error: error.toString() }, 500);
  }
}

function createResponse(data, status = 200) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
