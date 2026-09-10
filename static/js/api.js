/**
 * Endless Runner API Client
 * Handles communication with Django REST Framework backend.
 */
class RunnerApi {
    constructor() {
        this.baseUrl = '/api';
        this.token = localStorage.getItem('runner_auth_token') || null;
        this.user = JSON.parse(localStorage.getItem('runner_user') || 'null');
        this.profile = JSON.parse(localStorage.getItem('runner_profile') || 'null');
        this.activeCharacterSlug = localStorage.getItem('runner_active_char') || 'retro-dash';
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
        if (this.token) {
            headers['Authorization'] = `Token ${this.token}`;
        }
        return headers;
    }

    isAuthenticated() {
        return !!this.token;
    }

    async register(username, password, email = '') {
        try {
            const res = await fetch(`${this.baseUrl}/auth/register/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, email }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                this.setAuthSession(data.token, data.user, data.profile);
                return { success: true, data };
            }
            return { success: false, errors: data.errors || data.message || 'Registration failed' };
        } catch (err) {
            console.error('Registration error:', err);
            return { success: false, errors: err.message };
        }
    }

    async login(username, password) {
        try {
            const res = await fetch(`${this.baseUrl}/auth/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                this.setAuthSession(data.token, data.user, data.profile);
                return { success: true, data };
            }
            return { success: false, errors: data.errors || data.message || 'Login failed' };
        } catch (err) {
            console.error('Login error:', err);
            return { success: false, errors: err.message };
        }
    }

    async logout() {
        try {
            if (this.token) {
                await fetch(`${this.baseUrl}/auth/logout/`, {
                    method: 'POST',
                    headers: this.getHeaders(),
                });
            }
        } catch (e) {
            console.warn('Logout request warning:', e);
        } finally {
            this.clearAuthSession();
        }
    }

    setAuthSession(token, user, profile) {
        this.token = token;
        this.user = user;
        this.profile = profile;
        localStorage.setItem('runner_auth_token', token);
        localStorage.setItem('runner_user', JSON.stringify(user));
        if (profile) {
            localStorage.setItem('runner_profile', JSON.stringify(profile));
            if (profile.active_character_details) {
                this.activeCharacterSlug = profile.active_character_details.slug;
                localStorage.setItem('runner_active_char', this.activeCharacterSlug);
            }
        }
        window.dispatchEvent(new CustomEvent('user-auth-state', { detail: { authenticated: true, user, profile } }));
    }

    clearAuthSession() {
        this.token = null;
        this.user = null;
        this.profile = null;
        localStorage.removeItem('runner_auth_token');
        localStorage.removeItem('runner_user');
        localStorage.removeItem('runner_profile');
        window.dispatchEvent(new CustomEvent('user-auth-state', { detail: { authenticated: false, user: null, profile: null } }));
    }

    async getProfile() {
        try {
            const res = await fetch(`${this.baseUrl}/profile/`, {
                headers: this.getHeaders(),
            });
            const data = await res.json();
            if (res.ok && data.authenticated) {
                this.profile = data.profile;
                localStorage.setItem('runner_profile', JSON.stringify(data.profile));
                if (data.profile.active_character_details) {
                    this.activeCharacterSlug = data.profile.active_character_details.slug;
                    localStorage.setItem('runner_active_char', this.activeCharacterSlug);
                }
                window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: data.profile }));
            }
            return data;
        } catch (err) {
            console.error('Get profile error:', err);
            return null;
        }
    }

    async getLeaderboard(limit = 10) {
        try {
            const res = await fetch(`${this.baseUrl}/leaderboard/?limit=${limit}`, {
                headers: this.getHeaders(),
            });
            return await res.json();
        } catch (err) {
            console.error('Get leaderboard error:', err);
            return { success: false, leaderboard: [] };
        }
    }

    async submitScore(score, coins, distance, characterSlug, guestName = 'Guest Runner') {
        try {
            const payload = {
                score: Math.floor(score),
                coins_collected: Math.floor(coins),
                distance_traveled: Math.floor(distance),
                character_slug: characterSlug || this.activeCharacterSlug || 'retro-dash',
                guest_name: guestName,
            };

            const res = await fetch(`${this.baseUrl}/scores/`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                if (data.profile) {
                    this.profile = data.profile;
                    localStorage.setItem('runner_profile', JSON.stringify(data.profile));
                    window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: data.profile }));
                }
                return { success: true, data };
            }
            return { success: false, errors: data.errors || 'Score submission failed' };
        } catch (err) {
            console.error('Submit score error:', err);
            return { success: false, errors: err.message };
        }
    }

    async getShopList() {
        try {
            const res = await fetch(`${this.baseUrl}/shop/`, {
                headers: this.getHeaders(),
            });
            return await res.json();
        } catch (err) {
            console.error('Get shop error:', err);
            return { success: false, characters: [] };
        }
    }

    async unlockCharacter(slug) {
        try {
            const res = await fetch(`${this.baseUrl}/shop/unlock/`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ slug }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                if (this.profile) {
                    this.profile.total_coins = data.coins_remaining;
                    if (!this.profile.unlocked_character_slugs.includes(slug)) {
                        this.profile.unlocked_character_slugs.push(slug);
                    }
                    localStorage.setItem('runner_profile', JSON.stringify(this.profile));
                    window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: this.profile }));
                }
                return { success: true, data };
            }
            return { success: false, message: data.message || 'Unlock failed' };
        } catch (err) {
            console.error('Unlock error:', err);
            return { success: false, message: err.message };
        }
    }

    async selectCharacter(slug) {
        this.activeCharacterSlug = slug;
        localStorage.setItem('runner_active_char', slug);

        if (this.isAuthenticated()) {
            try {
                const res = await fetch(`${this.baseUrl}/shop/select/`, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify({ slug }),
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    if (this.profile) {
                        this.profile.active_character_details = data.active_character;
                        localStorage.setItem('runner_profile', JSON.stringify(this.profile));
                    }
                }
            } catch (err) {
                console.warn('Select character backend sync warning:', err);
            }
        }
        window.dispatchEvent(new CustomEvent('character-changed', { detail: { slug } }));
        return { success: true, slug };
    }

    getActiveCharacter() {
        return this.activeCharacterSlug || 'retro-dash';
    }
}

// Global API instance
window.runnerApi = new RunnerApi();
