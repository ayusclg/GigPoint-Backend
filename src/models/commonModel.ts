import mongoose from 'mongoose';

export interface ICommon extends mongoose.Document {
    createdAt: Date;
    updatedAt: Date;
    deleted: boolean;
}

export const commonSchemaFields = {
    createdAt: {
        type: Date,
        default: Date.now // changedAt must be triggered when the object is created not everytime.
    },
    updatedAt: {
        type: Date,
        default: Date.now // updatedAt must be triggered when the object is changed not everytime.
    },
    deleted: {
        type: Boolean,
        default: false
    }
};

export const createSchemaWithCommon = (schemaDefinition: any, options: any = {}) => {
    return new mongoose.Schema({
        ...commonSchemaFields,
        ...schemaDefinition
    }, {
        timestamps: true,
        ...options
    });
};