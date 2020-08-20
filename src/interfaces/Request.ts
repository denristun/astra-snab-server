import mongoose from 'mongoose'

interface Request extends mongoose.Document {
    request: string
    status: boolean
}

export default Request