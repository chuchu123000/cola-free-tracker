// Data Management
class ColaFreeTracker {
    constructor() {
        this.storageKey = 'colaFreeData';
        this.data = this.loadData();
        this.currentDate = new Date();
        this.currentMonth = new Date();
        this.init();
    }

    init() {
        this.renderCalendar();
        this.updateStats();
        this.updateBadges();
        this.bindEvents();
    }

    loadData() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            checkedDates: [], // Array of date strings in YYYY-MM-DD format
            achievements: []
        };
    }

    saveData() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    bindEvents() {
        // Check-in button
        document.getElementById('checkinBtn').addEventListener('click', () => {
            this.checkIn();
        });

        // Calendar navigation
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.changeMonth(-1);
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.changeMonth(1);
        });

        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => {
            if (confirm('确定要重置所有数据吗？此操作无法撤销！')) {
                this.resetData();
            }
        });
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    isSameDay(date1, date2) {
        return this.formatDate(date1) === this.formatDate(date2);
    }

    isChecked(date) {
        const dateStr = this.formatDate(date);
        return this.data.checkedDates.includes(dateStr);
    }

    checkIn() {
        const today = new Date();
        const todayStr = this.formatDate(today);

        if (this.data.checkedDates.includes(todayStr)) {
            this.showMessage('今天已经打卡过啦！继续保持哦 💪');
            return;
        }

        this.data.checkedDates.push(todayStr);
        this.saveData();

        // Update UI
        this.updateStats();
        this.updateBadges();
        this.renderCalendar();

        // Update button state
        const btn = document.getElementById('checkinBtn');
        btn.classList.add('checked');
        btn.querySelector('.btn-text').textContent = '✓ 今日已打卡';

        // Show celebration
        this.celebrate();
        this.showMessage('太棒了！又成功抵御可乐诱惑一天！🎉');
    }

    updateStats() {
        // Update button state for today
        const today = new Date();
        const btn = document.getElementById('checkinBtn');
        const hint = document.getElementById('checkinHint');

        if (this.isChecked(today)) {
            btn.classList.add('checked');
            btn.querySelector('.btn-text').textContent = '✓ 今日已打卡';
            hint.textContent = '今天已完成打卡！明天继续加油！';
        } else {
            btn.classList.remove('checked');
            btn.querySelector('.btn-text').textContent = '今日打卡 ✓';
            hint.textContent = '点击按钮记录今天没喝可乐！';
        }

        // Calculate streak
        const streak = this.calculateStreak();
        document.getElementById('currentStreak').textContent = streak;

        // Total days
        document.getElementById('totalDays').textContent = this.data.checkedDates.length;

        // Current month count
        const monthCount = this.getMonthCount();
        document.getElementById('monthCount').textContent = monthCount;
    }

    calculateStreak() {
        if (this.data.checkedDates.length === 0) return 0;

        // Sort dates in descending order
        const sortedDates = this.data.checkedDates
            .map(d => new Date(d))
            .sort((a, b) => b - a);

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if today or yesterday is checked
        let checkDate = new Date(today);
        if (!this.isChecked(today)) {
            checkDate.setDate(checkDate.getDate() - 1);
            if (!this.isChecked(checkDate)) {
                return 0;
            }
        }

        // Count consecutive days
        for (let i = 0; i < sortedDates.length; i++) {
            const currentDate = new Date(checkDate);
            currentDate.setHours(0, 0, 0, 0);
            
            if (this.isChecked(currentDate)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }

    getMonthCount() {
        const currentYear = this.currentDate.getFullYear();
        const currentMonth = this.currentDate.getMonth();

        return this.data.checkedDates.filter(dateStr => {
            const date = new Date(dateStr);
            return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
        }).length;
    }

    updateBadges() {
        const streak = this.calculateStreak();
        const achievements = [
            { name: 'day3', days: 3 },
            { name: 'day7', days: 7 },
            { name: 'day14', days: 14 },
            { name: 'day30', days: 30 },
            { name: 'day100', days: 100 }
        ];

        achievements.forEach(achievement => {
            const badge = document.querySelector(`[data-achievement="${achievement.name}"]`);
            if (streak >= achievement.days) {
                badge.classList.remove('locked');
                if (!this.data.achievements.includes(achievement.name)) {
                    this.data.achievements.push(achievement.name);
                    this.saveData();
                }
            }
        });
    }

    renderCalendar() {
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();

        // Update month header
        document.getElementById('currentMonth').textContent = 
            `${year}年${month + 1}月`;

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const numDays = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        // Clear calendar
        const calendarDays = document.getElementById('calendarDays');
        calendarDays.innerHTML = '';

        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'day empty';
            calendarDays.appendChild(emptyDay);
        }

        // Add days
        for (let day = 1; day <= numDays; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'day';
            dayElement.textContent = day;

            const currentDate = new Date(year, month, day);

            // Check if this day is checked
            if (this.isChecked(currentDate)) {
                dayElement.classList.add('checked');
            }

            // Check if this is today
            if (this.isSameDay(currentDate, new Date())) {
                dayElement.classList.add('today');
            }

            calendarDays.appendChild(dayElement);
        }
    }

    changeMonth(delta) {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + delta);
        this.renderCalendar();
    }

    celebrate() {
        const celebration = document.getElementById('celebration');
        celebration.classList.add('active');
        setTimeout(() => {
            celebration.classList.remove('active');
        }, 3000);
    }

    showMessage(message) {
        // Simple alert for now, could be enhanced with a toast notification
        const hint = document.getElementById('checkinHint');
        const originalText = hint.textContent;
        hint.textContent = message;
        hint.style.color = '#4CAF50';
        hint.style.fontWeight = 'bold';

        setTimeout(() => {
            hint.style.color = '';
            hint.style.fontWeight = '';
            this.updateStats(); // This will restore the proper hint text
        }, 3000);
    }

    resetData() {
        this.data = {
            checkedDates: [],
            achievements: []
        };
        this.saveData();
        this.renderCalendar();
        this.updateStats();
        
        // Reset all badges
        document.querySelectorAll('.badge').forEach(badge => {
            badge.classList.add('locked');
        });

        this.showMessage('数据已重置，重新开始吧！');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ColaFreeTracker();
});
