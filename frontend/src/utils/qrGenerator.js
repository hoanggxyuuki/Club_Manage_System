import { QRPay, BanksObject } from 'vietnam-qr-pay';

export const generateQR = ({ bankBin, accountNumber, amount, purpose }) => {
    
    if (!bankBin || !accountNumber || !purpose) {
        throw new Error('Missing required parameters for QR generation');
    }

    try {
        const qrPay = QRPay.initVietQR({
            bankBin: bankBin.toString(),
            bankNumber: accountNumber.toString(),
            amount: amount?.toString() || '0',
            purpose: purpose.toString()
        });

        const qrString = qrPay.build();

        if (!qrString || typeof qrString !== 'string') {
            throw new Error('Invalid QR string format');
        }

        return qrString;
    } catch (error) {
        console.error('QR generation error:', error);
        throw error;
    }
};


export const parseEventQR = (qrContent) => {
    try {
        
        let url;
        try {
            url = new URL(qrContent);
        } catch {
            
            const parts = qrContent.split('/');
            return {
                eventId: parts[0],
                code: parts[1]
            };
        }

        
        const pathParts = url.pathname.split('/');
        let eventId, code;

        
        const attendanceIndex = pathParts.indexOf('attendance');
        if (attendanceIndex !== -1 && attendanceIndex + 2 < pathParts.length) {
            eventId = pathParts[attendanceIndex + 1];
            code = pathParts[attendanceIndex + 2];
        } else {
            
            eventId = pathParts[pathParts.length - 2];
            code = pathParts[pathParts.length - 1];
        }

        if (!eventId || !code) {
            throw new Error('Invalid QR format');
        }

        return { eventId, code };
    } catch (error) {
        console.error('QR parsing error:', error);
        throw new Error('Invalid QR code format');
    }
};

export const bankList = Object.keys(BanksObject).map(key => ({
    name: BanksObject[key].name,
    bin: BanksObject[key].bin,
    code: BanksObject[key].code,
    shortName: BanksObject[key].shortName
}));

export default generateQR;
