/**
 * SoundWave Auth Screen Controller
 * Handles user login, registration, and session token storage.
 */

const { api } = require('../api/client');

class AuthScreenController {
  constructor() {
    this.state = {
      isLoginMode: true,
      username: '',
      email: '',
      password: '',
      isLoading: false,
      error: null,
      currentUser: null,
    };
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((fn) => fn(this.state));
  }

  toggleMode() {
    this.state.isLoginMode = !this.state.isLoginMode;
    this.state.error = null;
    this.notify();
  }

  async submit({ username, email, password }) {
    this.state.isLoading = true;
    this.state.error = null;
    this.notify();

    try {
      let res;
      if (this.state.isLoginMode) {
        res = await api.login(email || username, password);
      } else {
        res = await api.register(username, email, password);
      }

      this.state.currentUser = res.user;
      this.state.isLoading = false;
      this.notify();
      return res;
    } catch (err) {
      this.state.isLoading = false;
      this.state.error = err.message;
      this.notify();
      throw err;
    }
  }

  logout() {
    api.setToken(null);
    this.state.currentUser = null;
    this.notify();
  }
}

module.exports = {
  AuthScreenController,
  authController: new AuthScreenController(),
};
