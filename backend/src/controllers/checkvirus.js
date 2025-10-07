const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const VIRUS_SIGNATURES = [
  { pattern: '4D5A', name: 'Windows Executable (MZ)' },           
  { pattern: '504B0304', name: 'ZIP potentially containing malware' }, 
  { pattern: '7F454C46', name: 'ELF Executable' },               
  { pattern: '#!/', name: 'Shell Script', textBased: true },     
  { pattern: '<?php', name: 'PHP Code', textBased: true },        
  { pattern: '<script', name: 'JavaScript in image', textBased: true },
  { pattern: 'eval(', name: 'Suspicious eval code', textBased: true },  
  { pattern: 'TVqQAA', name: 'Windows Executable (base64)' },     
];

const DANGEROUS_EXTENSIONS = [
  '.exe', '.dll', '.bat', '.cmd', '.sh', '.jar', '.js', '.jse',
  '.vbs', '.vbe', '.wsf', '.wsh', '.ps1', '.php', '.phtml', '.asp',
  '.aspx', '.cer', '.scr', '.hta', '.apk', '.app', '.msi', '.py'
];

/**
 * Read a portion of the file to check for signatures
 * @param {string} filePath - Path to the file
 * @param {number} bytes - Number of bytes to read
 * @returns {Promise<Buffer>} - File buffer
 */
const readFileChunk = async (filePath, bytes = 8192) => {
  return new Promise((resolve, reject) => {
    const fd = fs.open(filePath, 'r', (err, fd) => {
      if (err) return reject(err);
      
      const buffer = Buffer.alloc(bytes);
      fs.read(fd, buffer, 0, bytes, 0, (err, bytesRead) => {
        fs.close(fd, () => {});
        if (err) return reject(err);
        resolve(buffer.slice(0, bytesRead));
      });
    });
  });
};

/**
 * Check if a file extension matches its actual content type
 * @param {string} filePath - Path to the file
 * @param {string} originalName - Original file name
 * @returns {Promise<boolean>} - True if consistent, false if not
 */
const validateFileTypeConsistency = async (filePath, originalName) => {
  const extension = path.extname(originalName).toLowerCase();
  
  const imageSignatures = { 
    '.jpg': ['FFD8FF'],
    '.jpeg': ['FFD8FF'],  
    '.png': ['89504E470D0A1A0A'], 
    '.gif': ['47494638'], 
    '.webp': [] 
  };
  
  if (imageSignatures.hasOwnProperty(extension)) {
    const fileHeader = await readFileChunk(filePath, 20); 
    const fileHeaderHex = fileHeader.toString('hex').toUpperCase();
    
    if (extension === '.webp') {
        
        
        if (fileHeader.length >= 12) { 
            return fileHeaderHex.startsWith('52494646') && fileHeaderHex.substring(16, 24) === '57454250';
        }
        return false; 
    }
    
    
    if (imageSignatures[extension].length === 0) return true; 
    return imageSignatures[extension].some(sig => fileHeaderHex.startsWith(sig));
  }
  
  return true; 
};

/**
 * Check for virus signatures in the file
 * @param {string} filePath - Path to the file
 * @returns {Promise<{found: boolean, signature: string}>} - Result of check
 */
const checkFileSignatures = async (filePath) => {
  try {
    const fileBuffer = await readFileChunk(filePath, 10240); 
    const fileHex = fileBuffer.toString('hex').toLowerCase(); 
    const fileText = fileBuffer.toString('utf8'); 

    
    const PNG_SIGNATURE = '89504e470d0a1a0a';
    const JPEG_SIGNATURE = 'ffd8ff';
    const GIF_SIGNATURE = '47494638'; 
    const WEBP_RIFF_SIGNATURE = '52494646'; 
    const WEBP_WEBP_SIGNATURE_HEX_OFFSET = 16; 
    const WEBP_WEBP_SIGNATURE = '57454250';   

    const isPNG = fileHex.startsWith(PNG_SIGNATURE);
    const isJPEG = fileHex.startsWith(JPEG_SIGNATURE);
    const isGIF = fileHex.startsWith(GIF_SIGNATURE);
    let isWEBP = false;
    if (fileHex.startsWith(WEBP_RIFF_SIGNATURE) && fileHex.length >= (WEBP_WEBP_SIGNATURE_HEX_OFFSET + 8)) { 
        if (fileHex.substring(WEBP_WEBP_SIGNATURE_HEX_OFFSET, WEBP_WEBP_SIGNATURE_HEX_OFFSET + 8) === WEBP_WEBP_SIGNATURE) {
            isWEBP = true;
        }
    }

    if (isPNG || isJPEG || isGIF || isWEBP) {
      console.log(`File is detected as image type - PNG: ${isPNG}, JPEG: ${isJPEG}, GIF: ${isGIF}, WEBP: ${isWEBP}`);
      return { found: false }; 
    }
    
    console.log(`File starts with hex: ${fileHex.substring(0, 20)}`);
    
    
    for (const sig of VIRUS_SIGNATURES) {
      if (sig.textBased) {
        if (fileText.toLowerCase().includes(sig.pattern.toLowerCase())) {
          return { found: true, signature: sig.name };
        }
      } else {
        const patternHex = sig.pattern.toLowerCase();
        if (fileHex.includes(patternHex)) {
          return { found: true, signature: sig.name };
        }
      }
    }
    
    return { found: false };
  } catch (error) {
    console.error('Error checking file signatures:', error);
    throw new Error('Failed to scan file for malicious signatures');
  }
};

/**
 * Calculate entropy of file to detect encrypted/packed malware
 * High entropy can indicate encryption or packing, common in malware
 * @param {string} filePath - Path to the file
 * @returns {Promise<number>} - Entropy value (0-8, higher means more random/encrypted)
 */
const calculateFileEntropy = async (filePath) => {
  try {
    const chunk = await readFileChunk(filePath, 4096);
    const byteCount = new Array(256).fill(0);
    
    
    for (let i = 0; i < chunk.length; i++) {
      byteCount[chunk[i]]++;
    }
    
    
    let entropy = 0;
    for (let i = 0; i < 256; i++) {
      if (byteCount[i] === 0) continue;
      
      const p = byteCount[i] / chunk.length;
      entropy -= p * Math.log2(p);
    }
    
    return entropy;
  } catch (error) {
    console.error('Error calculating file entropy:', error);
    return 0;
  }
};

/**
 * Check if the file has a dangerous file extension hidden in metadata
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} - True if suspicious metadata found
 */
const checkForHiddenExtensions = async (filePath) => {
  try {
    const chunk = await readFileChunk(filePath, 20480);
    const fileText = chunk.toString('utf8');
    
    
    for (const ext of DANGEROUS_EXTENSIONS) {
      if (fileText.includes(ext)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking for hidden extensions:', error);
    return false;
  }
};

/**
 * Main function to check file for virus/malware
 * @param {Object} file - File object with path and original name
 * @returns {Promise<Object>} - Result of virus scan
 */
const checkFileForVirus = async (file) => {
  const { path: filePath, originalname } = file;
  const scanResult = {
    file: originalname,
    timestamp: new Date(),
    isVirus: false,
    message: 'File is clean',
    scanLog: []
  };
  
  let isKnownImageType = false; 

  try {
    
    const fileExt = path.extname(originalname).toLowerCase();
    if (DANGEROUS_EXTENSIONS.includes(fileExt)) {
      scanResult.isVirus = true;
      scanResult.message = `Dangerous file extension detected: ${fileExt}`;
      scanResult.scanLog.push(`Rejected file with dangerous extension: ${fileExt}`);
      return scanResult;
    }
    
    
    const signatureCheck = await checkFileSignatures(filePath);
    if (signatureCheck.found) {
      scanResult.isVirus = true;
      scanResult.message = `Malicious signature detected: ${signatureCheck.signature}`;
      scanResult.scanLog.push(`Detected virus signature: ${signatureCheck.signature}`);
      return scanResult;
    } else {
        
        
        
        
        
        
    }
    
    
    const isConsistent = await validateFileTypeConsistency(filePath, originalname);
    if (!isConsistent) {
      scanResult.isVirus = true;
      scanResult.message = 'File extension doesn\'t match actual content type';
      scanResult.scanLog.push('Detected file type spoofing attempt');
      return scanResult;
    }

    
    const knownImageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    if (knownImageExtensions.includes(fileExt) && isConsistent) {
        
        
        const fileBuffer = await readFileChunk(filePath, 20); 
        const fileHex = fileBuffer.toString('hex').toLowerCase();
        const PNG_SIGNATURE = '89504e470d0a1a0a';
        const JPEG_SIGNATURE = 'ffd8ff';
        const GIF_SIGNATURE = '47494638';
        const WEBP_RIFF_SIGNATURE = '52494646';
        const WEBP_WEBP_SIGNATURE_HEX_OFFSET = 16;
        const WEBP_WEBP_SIGNATURE = '57454250';

        if (fileHex.startsWith(PNG_SIGNATURE) || 
            fileHex.startsWith(JPEG_SIGNATURE) || 
            fileHex.startsWith(GIF_SIGNATURE) || 
            (fileHex.startsWith(WEBP_RIFF_SIGNATURE) && fileHex.length >= (WEBP_WEBP_SIGNATURE_HEX_OFFSET + 8) && fileHex.substring(WEBP_WEBP_SIGNATURE_HEX_OFFSET, WEBP_WEBP_SIGNATURE_HEX_OFFSET + 8) === WEBP_WEBP_SIGNATURE)) {
            isKnownImageType = true;
            scanResult.scanLog.push('File confirmed as a standard image type, entropy check will be less strict or skipped.');
        }
    }
    
    
    
    if (!isKnownImageType) {
        const entropy = await calculateFileEntropy(filePath);
        
        if (entropy > 7.5) { 
            scanResult.isVirus = true;
            scanResult.message = 'Suspicious file detected: potentially encrypted/packed malware';
            scanResult.scanLog.push(`Abnormally high entropy detected: ${entropy.toFixed(2)}`);
            return scanResult;
        }
    } else {
        scanResult.scanLog.push('Skipped rigorous entropy check for validated image file.');
    }
    
    
    const hasHiddenExt = await checkForHiddenExtensions(filePath);
    if (hasHiddenExt) {
      scanResult.isVirus = true;
      scanResult.message = 'Suspicious metadata detected in file';
      scanResult.scanLog.push('Found dangerous strings in file metadata');
      return scanResult;
    }
    
    
    scanResult.scanLog.push('File passed all security checks');
    return scanResult;
    
  } catch (error) {
    console.error('Error during virus scan:', error);
    scanResult.isVirus = true; 
    scanResult.message = 'Error during security scan, rejecting file';
    scanResult.scanLog.push(`Scan error: ${error.message}`);
    return scanResult;
  }
};


const logScanResult = (result) => {
  const logMessage = `[${result.timestamp.toISOString()}] Scan: ${result.file} - ${
    result.isVirus ? 'REJECTED' : 'ACCEPTED'
  } - ${result.message}`;
  
  console.log(logMessage);
  
  
  
};

module.exports = {
  checkFileForVirus,
  logScanResult
};
