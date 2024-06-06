const path = require('path')
const multer = require('multer')

const postStorage = multer.diskStorage({
    destination: './uploads/posts',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

function checkPostFileType(file, cb) {
    // Allowed file extensions
    const filetypes = /jpeg|jpg|png|gif|mp4/;
    // Check the file extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check the MIME type
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Images or Videos Only!'));
    }
}

const postupload = multer({
    storage: postStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit per file,
    fileFilter: (req, file, cb) => {
        checkPostFileType(file, cb);
    }
})

//============================================================================

const commentStorage = multer.diskStorage({
    destination: './uploads/comments',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

function checkcommentFileType(file, cb) {
    // Allowed file extensions
    const filetypes = /jpeg|jpg|png|gif|mp4/;
    // Check the file extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check the MIME type
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Images or Videos Only!'));
    }
}

const commentUpload = multer({
    storage: commentStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit per file,
    fileFilter: (req, file, cb) => {
        checkcommentFileType(file, cb);
    }
})

//============================================================================

const replyStorage = multer.diskStorage({
    destination: './uploads/replies',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

function checkReplyFileType(file, cb) {
    // Allowed file extensions
    const filetypes = /jpeg|jpg|png|gif|mp4/;
    // Check the file extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check the MIME type
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Images or Videos Only!'));
    }
}

const replyUpload = multer({
    storage: replyStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit per file,
    fileFilter: (req, file, cb) => {
        checkReplyFileType(file, cb);
    }
})

module.exports = { commentUpload, postupload, replyUpload }
