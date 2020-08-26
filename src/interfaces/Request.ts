import mongoose from 'mongoose'

interface Request extends mongoose.Document {
    request: string
    status: string
}

export default Request