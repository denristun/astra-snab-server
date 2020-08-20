import mongoose from 'mongoose'
import BankDocument from '../interfaces/BankDocument';
import BankRequest from '../interfaces/BankRequest';
import Request from '../interfaces/Request'
import Group from '../interfaces/Group';
const url: any = "mongodb+srv://administrator:b20012DK@cluster0-e3xjm.mongodb.net/bank?retryWrites=true&w=majority"

// mongoose.set('useCreateIndex', true)
mongoose.connect( url, 
    {useNewUrlParser: true, useUnifiedTopology: true});
// const db = mongoose.connection;

const Schema = mongoose.Schema;

// Schemas
const bankRequestSchema = new Schema({
    request: { type: String, required: true, uppercase: true, trim: true },
    value: { type: Number },
    type: { type: String, required: true },
    bankId: { type: String, required: true },
    comment: { type: String, required: true },
    destination: { type: String },
    date: { type: String, required: true },
    client: { type: String },
    status: {type: Boolean, required: true, default: false}
});

const bankDocumentSchema = new Schema({
    date: { type: String, required: true },
    income: { type: Number, required: true },
    outcome: { type: Number, required: true },
    destination: { type: String},
    client: { type: String },
    organization: { type: String, required: true },
    id: { type: String, required: true, unique: true, index: true},
    
    requests: [bankRequestSchema]
});

const requestSchema = new Schema({
    request: { type: String, required: true, unique:true, index: true,  dropDups: true },
    status: { type: Boolean, required: true },
    _id: { type: String, required: true, unique:true, index: true,  dropDups: true}
});

const groupSchema = new Schema({
    group: { type: String, required: true, unique:true, index: true,  dropDups: true },
    _id: { type: String, required: true, unique:true, index: true,  dropDups: true}
});




export const BankDocumentModel = mongoose.model<BankDocument>('Document', bankDocumentSchema);
export const BankRequestModel = mongoose.model<BankRequest>('Request', bankRequestSchema);
export const RequestModel = mongoose.model<Request>('MainRequest', requestSchema);
export const GroupModel = mongoose.model<Group>('Group', groupSchema);



