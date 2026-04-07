# Commands

## Playwright

Build frontend:
`npm run build:client`

Start app for Playwright (localhost:6060):
`npm run start:pw`

Playwright test (headless, auto starts if not already started):
`npm run pw`

Playwright test (with UI, auto starts if not already started):
`npm run pw:ui`

Playwright codegen (localhost:6060):
`npm run pw:codegen`

## Volume Testing

0. Install k6 on windows using msi installer.
1. Build frontend using `npm run build:client`
2. Configure env with:

    ```env
    MONGO_URL=mongodb://root:rootpassword@localhost:27017/ecom_volume?authSource=admin
    SERVER_TIMEOUT_MS=300000
    NODE_ENV=production
    DEV_MODE=production
    ```

3. Start the application with: `npm run start`
4. Run full automated volume test pipeline: `npm run volume:run`
5. HTML export available in `k6/reports`

Live k6 web dashboard during run (default):
`http://localhost:5665`

### Other useful commands

Start MongoDB for volume testing (2 CPU, 4 GB):
`npm run volume:mongo:up`

Seed large volume dataset into MongoDB:
`npm run volume:seed`

Validate seeded counts (categories/users/products/orders):
`npm run volume:validate`

Stop volume-testing MongoDB container:
`npm run volume:mongo:down`
