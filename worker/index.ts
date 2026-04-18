import { createApi } from './http/create-api';

const app = createApi();

export default {
  fetch: app.fetch,
};
