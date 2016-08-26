'use strict';

const cowsay = require('cowsay');
const path = require("path");
const fs = require("fs");


exports.list = (callback) => {
    cowsay.list((err, cows) => {
      fs.readdir(path.relative(process.cwd(), "cows"), (err, files) => {
        if (err) return callback(err);

        let my_cows = files.map((cow) => {
            return `cows/${path.basename(cow)}`;
        });

        return callback(null, cows.concat(my_cows));
      });
    });
};
