const mongoose = require('mongoose');
const Schema = mongoose.Schema;


// create ninja Schema & model
const SearchSchema = new Schema({
    term: {
        type:String
    },
    when: {
        type:String
    },
    from: {
    	type:String
    } 
});

const Search = mongoose.model('search', SearchSchema);

module.exports = Search;
