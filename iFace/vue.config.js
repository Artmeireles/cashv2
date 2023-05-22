import Dotenv from 'dotenv-webpack';

export const configureWebpack = {
    plugins: [
        new Dotenv()
    ]
};
