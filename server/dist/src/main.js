"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./config/env");
const app_1 = require("./app");
app_1.app.listen(env_1.env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server started at http://localhost:${env_1.env.port}`);
});
