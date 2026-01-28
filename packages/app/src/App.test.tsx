import { render, waitFor} from "@testing-library/react";
import App from './App';

describe('App', () => {
  it('should render', async () => {
    process.env = {
      NODE_ENV: 'test',
      APP_CONFIG: [
        {
          data: {
            app: { title: 'Test' },
            backend: { baseUrl: 'http://localhost:7007' },
            techdocs: {
              storageUrl: 'http://localhost:7007/api/techdocs/static/docs',
            },
          },
          context: 'test',
        },
      ] as any,
    };

    // App is now a React element (from app.createRoot()), not a component
    const rendered = render(App);

    await waitFor(() => {
    expect(rendered.baseElement).toBeInTheDocument()
    });
  });
});
