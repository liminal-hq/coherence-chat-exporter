# CI Setup and Branch Protection

This document explains the Continuous Integration (CI) setup and how to configure GitHub Branch Protection Rules to ensure code quality and block Pull Requests (PRs) that fail checks.

## Workflow Overview

The CI workflow is defined in `.github/workflows/ci.yml` and consists of three parallel jobs:

1.  **`lint`**: Checks code style and potential errors using ESLint.
2.  **`test`**: Runs the test suite using Jest and generates a JUnit XML report.
3.  **`build`**: Compiles the TypeScript code, bundles it into a standalone script, and uploads the bundle artifact.

## Blocking Pull Requests

To ensure that no code is merged into `main` without passing these checks, you must configure **Branch Protection Rules**.

### Steps to Configure:

1.  Go to your GitHub repository.
2.  Click on **Settings** > **Branches**.
3.  Click **Add rule**.
4.  **Branch name pattern**: Enter `main`.
5.  Check **Require status checks to pass before merging**.
6.  In the search box that appears ("Search for status checks"), search for and select the following jobs:
    *   `lint`
    *   `test`
    *   `build`
7.  (Optional) Check **Require branches to be up to date before merging**.
8.  Click **Create**.

Once configured, any PR targeting `main` will be blocked from merging until `lint`, `test`, and `build` jobs complete successfully.

## Viewing Test Results

Test results are uploaded as an artifact for every run.

1.  Go to the **Actions** tab in your repository.
2.  Click on the specific workflow run you want to inspect.
3.  Scroll down to the **Artifacts** section.
4.  Download the **`test-results`** artifact (contains `junit.xml`).
5.  You can view this XML file or use it with third-party tools/actions to visualize failures.

Additionally, failed tests will cause the `test` job to fail, and the console output in the **Actions** log will show the specific errors.
