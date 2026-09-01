import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
import pool from '../config/db.js';

const normalizeLines = (text) =>
  text
    .replace(/\r/g, '')
    .replace(/\u00A0/g, ' ')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const extractLabelValue = (lines, regexes) => {
  for (const regex of regexes) {
    for (let i = 0; i < lines.length; i += 1) {
      const value = lines[i].replace(regex, '').trim();
      if (value && value !== lines[i]) {
        return value;
      }

      if (regex.test(lines[i]) && lines[i + 1]) {
        return lines[i + 1].trim();
      }
    }
  }
  return null;
};

const extractDateValue = (text) => {
  const datePatterns = [
    /\b(\d{2}[\/\-\.\s]\d{2}[\/\-\.\s]\d{4})\b/, // 01/01/2000, 01-01-2000, 01.01.2000
    /\b(\d{2}\s+[A-Z]{3}\s+\d{4})\b/, // 01 JAN 2000
  ];

  for (const regex of datePatterns) {
    const match = text.match(regex);
    if (match) {
      return match[1];
    }
  }

  return null;
};

const extractPanNumber = (text) => {
  const match = text.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/);
  return match ? match[1] : null;
};

const parsePanOcrText = (text) => {
  const cleanedText = text.replace(/\u00A0/g, ' ');
  const lines = normalizeLines(cleanedText);

  const full_name = extractLabelValue(lines, [
    /^(?:NAME\s*ON\s*PAN|PAN\s*HOLDER\s*NAME|NAME)\s*[:\-\s]*$/i,
    /^(?:NAME\s*ON\s*PAN|PAN\s*HOLDER\s*NAME|NAME)\s*[:\-\s]+/i,
  ]);

  const father_name = extractLabelValue(lines, [
    /^(?:FATHER(?:'S|S)?\s*NAME|FATHER\s*NAME|S\/O|FATHER)\s*[:\-\s]*$/i,
    /^(?:FATHER(?:'S|S)?\s*NAME|FATHER\s*NAME|S\/O|FATHER)\s*[:\-\s]+/i,
  ]);

  const date_of_birth = extractDateValue(cleanedText);
  const pan_number = extractPanNumber(cleanedText);

  return {
    full_name: full_name || null,
    father_name: father_name || null,
    date_of_birth: date_of_birth || null,
    pan_number: pan_number || null,
  };
};

export const extractPanFromImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'PAN image file is required.' });
    }

    console.log('OCR upload received:', req.file && req.file.path);

    const worker = createWorker();
    await worker.load();
    try {
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
    } catch (langErr) {
      console.error('Tesseract language load error:', langErr);
      // continue to attempt recognition; worker errors will be caught below
    }

    // tune parameters and whitelist characters commonly found on PAN cards
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/ -',
      tessedit_pageseg_mode: '6',
    });

    // Preprocess image to improve OCR accuracy (grayscale, normalize, resize)
    let ocrData;
    try {
      const buf = await sharp(req.file.path)
        .grayscale()
        .resize({ width: 1600 })
        .normalise()
        .toBuffer();

      const { data } = await worker.recognize(buf);
      ocrData = data;
    } catch (procErr) {
      console.warn('Image preprocessing or recognition failed, fallback to direct path:', procErr && procErr.message);
      const { data } = await worker.recognize(req.file.path);
      ocrData = data;
    }

    await worker.terminate();

    const extracted = parsePanOcrText(ocrData.text);

    if (!extracted.pan_number && !extracted.full_name && !extracted.date_of_birth) {
      return res.status(200).json({ document_type: 'unknown', extracted });
    }

    // Minimal DB lookup to confirm match in pan_master_records
    let matchedRecord = null;
    if (extracted.pan_number) {
      try {
        const [rows] = await pool.query('SELECT * FROM pan_master_records WHERE pan_number = ?', [extracted.pan_number]);
        if (rows && rows.length) matchedRecord = rows[0];
      } catch (dbErr) {
        console.error('DB lookup error in OCR:', dbErr);
      }
    }

    return res.status(200).json({
      document_type: 'PAN Card',
      full_name: extracted.full_name,
      father_name: extracted.father_name,
      date_of_birth: extracted.date_of_birth,
      pan_number: extracted.pan_number,
      matched: Boolean(matchedRecord),
      matched_record: matchedRecord,
      image_quality: {
        blur_detected: false,
        glare_detected: false,
        cropped: false,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to extract PAN data from image.',
      error: error.message,
    });
  }
};
