var mongoose = require('mongoose');
var bannerSchema = mongoose.Schema({

    bannerName: {
        type: String
    },
    bannerImage: {
        type: String
    }
});

module.exports = mongoose.model("Banner", bannerSchema);