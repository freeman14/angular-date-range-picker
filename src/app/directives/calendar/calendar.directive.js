export function Calendar() {
  'ngInject';

  let directive = {
    restrict: 'E',
    scope: {
      minDay: '&',
      minRangeDay: '&',
      maxRangeDay: '&',
      maxDay: '&',
      weekStart: '&',
      getMonth: '&month',
      getInterceptors: '&interceptors',
      rangeStart: '&',
      rangeEnd: '&',
      selectedDay: '&',
      minMonth: '&',
      maxMonth: '&',
      weekDaysName: '&',
      monthFormat: '&',
      inputFormat: '&',
      showInput: '&',
      hovered: '&',
      api: '=?',
      static: '=?',
      turn: '&'
    },
    templateUrl: 'app/directives/calendar/calendar.html',
    controller: CalendarController,
    controllerAs: 'month',
    bindToController: true
  };

  return directive;
}

class CalendarController {
  constructor(moment, $scope, $attrs) {
    'ngInject';

    this.Moment = moment;
    this.Scope = $scope;
    this.Attrs = $attrs;
    this.api && this.setApi();
    this.firstRender();
  }

  setApi() {
    Object.assign(this.api, {
      render: this.render.bind(this)
    });
  }

  firstRender() {
    this.defaultWeekDaysNames = this.weekDaysName() || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    this.firstDayOfWeek = this.weekStart() || 'su';
    this.daysOfWeek = this.buildWeek(this.firstDayOfWeek);
    this.calendar = this.buildCalendar(this.getMonth());
    this.interceptors = this.getInterceptors() || {};
    this.setListeners();
    this.daysName = this.setWeekDaysNames(this.daysOfWeek);
  }

  render() {
    this.daysOfWeek = this.buildWeek(this.firstDayOfWeek);
  }

  setValue() {
    if (this.selectedDay()) {
      this.value = this.selectedDay().format(this.getInputFormat());
    }
  }

  setWeekDaysNames(weekDays, daysName = this.defaultWeekDaysNames) {
    let weekDayNames = [];
    let defPosMap = {
      'su': 0,
      'mo': 1,
      'tu': 2,
      'we': 3,
      'th': 4,
      'fr': 5,
      'sa': 6
    };

    weekDays.forEach((day, index) => {
      let defPos = defPosMap[day];
      weekDayNames[index] = daysName[defPos];
    });

    return weekDayNames;
  }

  setListeners() {
    this.Scope.$watch(() => {
      return this.getMonth();
    }, (newMonth) => {
      this.calendar = this.buildCalendar(newMonth);
    });

    this.Scope.$watch(() => {
      return this.hovered();
    }, (hovered) => {
      this.updateDaysProperties(this.calendar.monthWeeks, hovered);
    });

    this.Scope.$watchGroup([
      () => this.rangeStart(),
      () => this.rangeEnd(),
      () => this.turn()
    ], () => {
      this.setValue();
      this.updateDaysProperties(this.calendar.monthWeeks);
    });
  }

  updateDaysProperties(monthWeeks) {
    let minDay = this.minDay();
    let maxDay = this.maxDay();
    let selectedDay = this.selectedDay();
    let rangeStart = this.rangeStart();
    let rangeEnd = this.rangeEnd();
    let turn = this.turn();
    let isHoverInRange = this.isHoverInRange();
    let maxRangeDay = this.maxRangeDay();

    if (turn === 'second' && typeof maxRangeDay === 'undefined') {
      maxRangeDay = rangeStart.clone().add(29, 'days');
    }

    monthWeeks.forEach((week) => {
      week.forEach((day) => {
        
        day.selected = day.mo.isSame(selectedDay || null, 'day');
        day.inRange = this.isInRange(day.mo);
        day.future = day.mo.isAfter(maxDay, 'day');
        // day.inHoverRange = this.isInHoverRange(day.mo);
        day.rangeStart = day.mo.isSame(rangeStart || null, 'day');
        day.rangeEnd = day.mo.isSame(rangeEnd || null, 'day');

        day.inStaticRange = this.isInStaticRange(day.mo);
        day.staticRangeStart = day.mo.isSame(this.static.start || null, 'day');
        day.staticRangeEnd = day.mo.isSame(this.static.end || null, 'day');
        day.opacity = false;
        if (turn === 'second' && typeof this.hovered() !== 'undefined') {

          day.inRange = this.isInSecondHoverRange(day.mo, maxRangeDay);

          if (day.inRange) {
            day.rangeEnd = false;
            day.selected = false;
          } else {
            day.rangeStart = false;
            day.rangeEnd = false;
            day.selected = false;
            day.opacity = true;
          }


        } else if (turn === 'first' && typeof this.hovered() !== 'undefined') {

          if (isHoverInRange === true) {
            day.inRange = this.isInFirstHoverRange(day);
            day.rangeStart = false;
            day.selected = false;
          } else {
            day.rangeStart = false;
            day.rangeEnd = false;
            day.selected = false;
            day.opacity = true;
          }

        }

        if (minDay) {
          day.disabled = day.mo.isBefore(minDay, 'day');
        }
        if (maxDay && !day.disabled) {
          day.disabled = day.mo.isAfter(maxDay, 'day');
        } else {
          day.disabled = false;
        }

        if (turn === 'second') {
          day.disabled = day.mo.isAfter(maxRangeDay, 'day'); 
        }

      });
    });
  }

  buildWeek(firstDay) {
    let daysOfWeek = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
    let pivot = daysOfWeek.indexOf(firstDay.toLowerCase());
    let firstHalf = daysOfWeek.slice(0, pivot);
    let secondHalf = daysOfWeek.slice(pivot, daysOfWeek.length);
    let week = secondHalf.concat(firstHalf);

    return week;
  }

  buildCalendar(date = this.Moment()) {
    let monthWeeks = [[], [], [], [], [], []];
    let monthRange = this.getMonthDateRange(date.year(), date.month() + 1);
    let firstDayOfMonth = monthRange.start;

    let pivot = this.daysOfWeek.indexOf(firstDayOfMonth.format('dd').toLowerCase());
    let tmpDate = firstDayOfMonth.clone().subtract(pivot, 'd');

    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 7; j++) {
        monthWeeks[i][j] = {
          mo: tmpDate,
          currentDay: tmpDate.isSame(this.Moment(), 'day'),
          currentMonth: tmpDate.isSame(date, 'month')
        };
        tmpDate = tmpDate.clone().add(1, 'd');
      }
    }

    this.updateDaysProperties(monthWeeks);

    return {
      currentCalendar: date,
      selectedDate: date,
      firstDayOfMonth: monthRange.start.format('D'),
      lastDayOfMonth: monthRange.end.format('D'),
      monthWeeks: monthWeeks
    };
  }

  moveCalenderByMonth(months) {
    let mo = this.calendar.currentCalendar;
    this.month = mo.clone().add(months, 'M');
    this.calendar = this.buildCalendar(this.month.clone());
  }

  moveToNext() {
    if (this.interceptors.moveToNextClicked) {
      this.interceptors.moveToNextClicked.call(this.interceptors.context);
    } else {
      this.moveCalenderByMonth(1);
    }
  }

  moveToPrev() {
    if (this.interceptors.moveToPrevClicked) {
      this.interceptors.moveToPrevClicked.call(this.interceptors.context);
    } else {
      this.moveCalenderByMonth(-1);
    }
  }

  getMonthDateRange(year, month) {
    let startDate = this.Moment([year, month - 1]);
    let endDate = this.Moment(startDate).endOf('month');
    return { start: startDate, end: endDate };
  }

  isInRange(day) {
    let inRange = false;
    let rangeStart = this.rangeStart() || null;
    let rangeEnd = this.rangeEnd() || null;
    inRange = day.isBetween(rangeStart, rangeEnd) || day.isSame(rangeStart, 'day') ||
      inRange || day.isSame(rangeEnd, 'day');

    return inRange;
  }

  isInHoverRange(day) {
    let inRange = false;
    let rangeStart = this.rangeStart() || null;
    let hovered = this.hovered() || null;
    inRange = day.isBetween(rangeStart, hovered) || day.isSame(hovered, 'day');
    return inRange;
  }

  isHoverInRange() {
    let hovered = this.hovered() || null;
    let rangeStart = this.rangeEnd().clone().subtract(29, 'days') || null;
    let rangeEnd = this.rangeEnd() || null;

    if (hovered !== null) {
      return hovered.isBetween(rangeStart, rangeEnd.endOf('day')) || hovered.isSame(rangeStart, 'day') || hovered.isSame(rangeEnd, 'day');
    }

    return undefined;

  }

  isInFirstHoverRange(day) {
    let d = typeof day.mo !== 'undefined' ? day.mo : day;
    let inRange = false;
    let rangeEnd = this.rangeEnd() || null;
    let hovered = this.hovered() || null;
    
    inRange = d.isBetween(hovered, rangeEnd.endOf('day')) || d.isSame(hovered, 'day') || d.isSame(rangeEnd, 'day');
    return inRange;
  }

  isInSecondHoverRange(day, maxRangeDay) {
    let d = typeof day.mo !== 'undefined' ? day.mo : day;
    let inRange = false;
    let hovered = this.hovered() || null;
    let rangeStart = this.rangeStart() || null;

    if (d.isBetween(rangeStart, maxRangeDay.endOf('day')) || d.format('MM-DD-YYYY') == rangeStart.format('MM-DD-YYYY')) {
      
      inRange = d.isBetween(rangeStart, hovered) || d.isSame(rangeStart, 'day') || d.isSame(hovered, 'day');

      if (hovered.diff(rangeStart, 'days') < 0) {
        inRange = false;
      }

    }

    return inRange;
  }

  isOutOfFirstHoverRange() {
    let inRange = false;
    let rangeEnd = this.rangeEnd() || null;
    let hovered = this.hovered() || null;
    inRange = hovered.diff(rangeEnd, 'days') < -29;
    return inRange;
  }

  isInStaticRange(day) {
    let inRange = false;
    let rangeStart = this.static.start || null;
    let rangeEnd = this.static.end || null;
    inRange = day.isBetween(rangeStart, rangeEnd) || day.isSame(rangeStart, 'day') ||
      inRange || day.isSame(rangeEnd, 'day');

    return inRange;
  }

  daySelected(day) {
    this.dayHovered(day, false);
    if (!day.disabled && !day.future) {
      if (this.interceptors.daySelected) {
        this.interceptors.daySelected.call(this.interceptors.context, day.mo);
      }
    }
  }

  dayHovered(day, mouseover) {
    if (!day.disabled && !day.future) {
      if (this.interceptors.dayHovered) {
        this.interceptors.dayHovered.call(this.interceptors.context, day.mo, mouseover);
      }
    }
  }

  dateInputEntered(ev, value) {
    if (ev.keyCode == 13) {
      this.dateInputSelected(ev, value);

      // should prevent form submit if placed inside a form
      ev.preventDefault();
    }
  }

  dateInputSelected(ev, value) {
    let day = this.Moment(value, this.getInputFormat(), true);

    if (day.isValid()) {
      let minDay = this.minDay();
      let maxDay = this.maxDay();
      day = minDay && day.isBefore(minDay, 'day') ? minDay : day;
      day = maxDay && day.isAfter(maxDay, 'day') ? maxDay : day;

      if (!this.selectedDay() || !this.selectedDay().isSame(day, 'day')) {
        if (this.interceptors.inputSelected) {
          this.interceptors.inputSelected(day);
        } else {
          this.daySelected({ mo: day });
        }
      }
    }
  }

  getFormattedMonth(day) {
    return this.Moment(day).format(this.getMonthFormat());
  }

  getMonthFormat() {
    return this.monthFormat() || 'MMMM YYYY';
  }

  getInputFormat() {
    return this.inputFormat() || 'MMM DD, YYYY';
  }

  showLeftArrow() {
    return this.minMonth() ? !this.minMonth().isSame(this.getMonth().clone().subtract(1, 'M'), 'M') : true;
  }

  showRightArrow() {
    if (
      this.getMonth().format('MM-YYYY') === this.maxDay().format('MM-YYYY') ||
      this.getMonth() > this.maxDay() ||
      this.getMonth() > this.maxRangeDay() ||
      this.getMonth() > this.maxMonth()
    ) {
      return false;
    }
    return this.maxMonth() ? !this.maxMonth().isSame(this.getMonth().clone().add(1, 'M'), 'M') : true;
  }

  _showInput() {
    return angular.isDefined(this.showInput()) ? this.showInput() : true;
  }
}
