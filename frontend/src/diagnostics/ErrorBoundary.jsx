import { Component } from "react";
import ErrorIcon from "../icons/ErrorIcon";
import { Trans } from "react-i18next";
import { copyText } from "../utils/copyText";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      showDetails: false,
      copied: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    this.props.onError && this.props.onError(error, info);
  }

  reload = () => {
    if (this.props.onRetry) this.props.onRetry();
    else window.location.reload();
  };

  copy = async () => {
    const payload = JSON.stringify(
      {
        message: String(this.state.error),
        stack: this.state.error?.stack ?? null,
        ua: navigator.userAgent,
      },
      null,
      2
    );

    const success = await copyText(payload);
    if (success) {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 1500);
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        className="
          fixed inset-0 z-[9999]
          backdrop-blur-sm
          flex items-center justify-center min-w-0
          py-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]
        "
      >
        <div className="card flex flex-col items-center justify-center border border-gray-300 min-w-0">
          <div className="mb-5">
            <span className="inline-flex items-center justify-center bg-red-50 rounded-full p-4">
              <ErrorIcon />
            </span>
          </div>

          <h1 className="text-title-red-gradient font-bold mb-2 text-center">
            <Trans i18nKey="error_state.oops_message" />
          </h1>
          <p className="text-caption mb-4 text-center">
            <Trans i18nKey="error_state.description" />
          </p>

          <div className="flex flex-col gap-2 w-full">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
              <button onClick={this.reload} className="btn btn-danger w-full">
                <Trans i18nKey="error_state.reload" />
              </button>

              <button onClick={this.copy} className="btn btn-secondary w-full">
                {this.state.copied ? (
                  <Trans i18nKey="error_state.copied_success" />
                ) : (
                  <Trans i18nKey="error_state.copy_report" />
                )}
              </button>
            </div>

            <button
              onClick={() =>
                this.setState((s) => ({ showDetails: !s.showDetails }))
              }
              className="ml-auto underline underline-offset-4 text-caption"
            >
              {this.state.showDetails ? (
                <Trans i18nKey="error_state.hide_details" />
              ) : (
                <Trans i18nKey="error_state.show_details" />
              )}
            </button>
          </div>

          {this.state.showDetails && (
            <div className="mt-4 rounded-lg border border-gray-300 p-3 select-auto w-full bg-gray-200">
              <pre className="max-h-60 overflow-auto whitespace-pre-wrap text-xs text-black m-0">
                {String(this.state.error?.stack || this.state.error)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }
}
