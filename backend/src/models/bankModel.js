const mongoose = require('mongoose');
const moment = require('moment');


const parseDateWithFormats = (value) => {
    if (value instanceof Date) return value;
    
    const dateFormats = [
        "DD/MM/YYYY HH:mm:ss",
        "DD/MM/YYYY HH:mm",
        "DD/MM/YYYY",
        "YYYY-MM-DD HH:mm:ss",
        "YYYY-MM-DD HH:mm",
        "YYYY-MM-DD",
        "MM/DD/YYYY HH:mm:ss",
        "MM/DD/YYYY HH:mm",
        "MM/DD/YYYY"
    ];

    const parsed = moment(value, dateFormats);
    if (parsed.isValid()) {
        return parsed.toDate();
    }
    throw new Error(`Invalid date format: ${value}`);
};

const sessionSchema = new mongoose.Schema({
    sessionId: String,
    deviceId: String,
    lastLogin: Date
});

const transactionSchema = new mongoose.Schema({
    refNo: String,
    postingDate: String,
    transactionDate: {
        type: Date,
        required: true,
        set: parseDateWithFormats
    },
    accountNo: String,
    creditAmount: String,
    debitAmount: String,
    currency: String,
    description: String,
    addDescription: String,
    availableBalance: String,
    processedForMember: Boolean,
    memberUsername: String,
    memberId: mongoose.Schema.Types.ObjectId
});

const paymentSchema = new mongoose.Schema({
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    username: String,
    amount: Number,
    transactionRef: String,
    transactionDate: {
        type: Date,
        required: true,
        set: parseDateWithFormats
    }
});

const bankSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    accountNo: {
        type: String,
        required: true
    },
    session: sessionSchema,
    transactions: [transactionSchema],
    memberPayments: [paymentSchema],
    lastUpdated: Date
}, {
    timestamps: true
});

bankSchema.index({ accountNo: 1 });
bankSchema.index({ username: 1, accountNo: 1 });
bankSchema.index({ 'transactions.refNo': 1 });
bankSchema.index({ 'memberPayments.memberId': 1 });

const Bank = mongoose.model('Bank', bankSchema);

module.exports = Bank;