/** 
 * @param {number} indent - number of spaces
 * @returns {string} A string consisting of the specified number of spaces. 
 */
function spaces(indent) {
  let s = "";
  for (let i=0; i<indent; i++)
    s += " ";
  return s;
}

/**
 * @param {number} n
 * @param {*} thing
 * @returns {string}
 */
function num(n, thing) {
  if (n === 1) return `1 ${thing}`;
  else return `${n} ${thing}s`;
}

class TestCase {
  
  /**
   * @param {string[]} unit 
   * @param {string} descr
   * @param {() => void} tc
   */
  constructor(unit, descr, tc) {
    this.unit = unit;
    this.descr = descr;
    this.tc = tc;
    this.succeeded = 0;
    this.failed = 0;
    /** @type {Error[]} */
    this.errors = [];
    /** @type {TestCase[]} */
    this.processedTestCases = [];
    /** @type {TestCase[]} */
    this.testCases = [];
  }

  checkCanAssert() {
    if (!this.unit) throw new Error("Not in test case, cannot assert.");
  }

  /** @param {boolean} value */
  assert(value) {
    if (value === true) {
      this.succeeded++;
    } else {
      this.failed++;
    }
  }  

  /** 
   * @param {string?} descr
   * @param {() => void} tc 
   */
  add(descr, tc) {
    let unit = this.unit ?? currentUnit();   
    if (!unit) throw new Error("not in unit, cannot schedule test '" + descr + "'");
    // @ts-ignore
    this.testCases.push(new TestCase(unit, descr, tc));
  }  

  cancel() {
    this.startTime = undefined;
    this.endTime = undefined;
    // @ts-ignore 
    this.tc = undefined;
    this.testCases = [];
    this.processedTestCases = [];
  }
  
  /**
   * @param {(unit: string[]) => boolean} unitFilter
   */
  async run(unitFilter) {
    if (this.unit && !unitFilter(this.unit)) {
      this.cancel();
      return;
    }
    this.endTime = undefined;
    this.startTime = Date.now();
    if (this.tc) {
      currentTestCase = this;
      try {
        await this.tc();
      } catch (error) {
        if (error instanceof Error)
          this.errors.push(error);
        else 
          this.errors.push(new Error(String(error)));
      }
    }
    let testCases = this.testCases;
    this.testCases = [];
    for await (const testCase of testCases) {
      currentTestCase = testCase;
      await testCase.run(unitFilter);
    }
    for (const testCase of testCases) {
      if (testCase.descr && !testCase.empty()) {
        this.processedTestCases.push(testCase);
      } else {
        this.processedTestCases.push(...testCase.processedTestCases);
        this.errors.push(...testCase.errors);
        this.succeeded += testCase.succeeded;
        this.failed += testCase.failed;
      }
    }
    currentTestCase = this;
    this.endTime = Date.now();
  }

  summary() {
    let totalSuccesses = this.succeeded;
    let totalFailures = this.failed;
    let totalErrors = this.errors.length;
    for (const testCase of this.processedTestCases) {
      let [s, f, e] = testCase.summary();
      totalSuccesses += s;
      totalFailures += f;
      totalErrors += e;
    }
    return [totalSuccesses, totalFailures, totalErrors];
  }

  summaryInfo() {
    let [s, f, e] = this.summary();
    let total = s + f + e;
    let d = this.duration();
    if (d === undefined) d = ""; else d = " (in " + d + ")";
    if (total === s) { return `Successfully checked ${num(total, "assertion")}${d}.` }
    if (e > 0) {
      return `There ${e === 1 ? "was" : "were"} ${num(e, "error")}. Otherwise, ${num(s, "assertion")} succeeded and ${num(f,  "assertion")} failed.`;
    }
    return `${num(s, "assertion")} succeeded and ${num(f, "assertion")} failed.`;
  }

  /**
   * @param {number} indent
   * @param {string} prefix
   * @param {(s : string) => void} log
   */
  log(indent, prefix, log) {
    const sp = spaces(indent);
    if (!this.unit) {
      log(sp + prefix + this.summaryInfo());
    } else if (!this.descr) {
      log(sp + prefix + unitDescr(this.unit) + `: ` + this.summaryInfo());
    } else {
      log(sp + prefix + unitDescr(this.unit) + `/` + this.descr + `: ` + this.summaryInfo());
    }
    let testCases = this.processedTestCases
    if (this.errors.length > 0) {
      log(`${sp}  The test contains ${num(this.errors.length, "error")}:`);
      let index = 1;
      for (const e of this.errors) {
        log(`${sp}  ${index}) ${e.name}: ${e.message}`);
        index++;
      }
    }
    if (testCases.length > 0) {
      log(`${sp}  The test has ${num(testCases.length, "subtest")}:`);
      let index = 1;
      for (const testCase of testCases) {
        testCase.log(indent + 2, `${index}) `, log);
        index++
      }
    }
  }  

  successful() {
    return this.failed === 0 && this.errors.length === 0;
  }

  empty() {
    return this.succeeded === 0 && this.failed === 0 && this.errors.length === 0 && this.processedTestCases.length === 0 && this.testCases.length === 0;
  }


  duration() {
    if (this.startTime === undefined || this.endTime === undefined) { return undefined; }
    let millis = this.endTime - this.startTime;
    if (millis < 2) return undefined;
    if (millis < 500) return millis + " ms";
    else return (Math.round(millis / 100) / 10) +" s";
  }  

}

// @ts-ignore
var currentTestCase = new TestCase();

/** @type {string[][]} */
var units;

/** @type {Set<string>} */
var allUnitsEver;

/** @param {string[]}  unit */
function unitDescr(unit) {
  var d = "";
  for (const s of unit) {
    if (d == "") d = s;
    else d += "/" + s;
  }
  return d;
}

/** 
 * @param {*} x
 * @param {*} y
 * @returns {boolean} 
 */
export function eq(x, y) {
  if (x === y) return true;
  if (Number.isNaN(x)) {
    return Number.isNaN(y);
  } else if (typeof x === "object") {
    if (typeof y !== "object") return false;
    for (const k in x) {
      if (!eq(x[k], y[k])) return false;
    }
    for (const k in y) {
      if (!eq(x[k], y[k])) return false;
    }
    return true;
  } else return false;
}

/**
 * @param {string} packageName
 * @param {string[]} qualifiers
 */
export function beginUnit(packageName, ...qualifiers) {
  const u = [packageName, ...qualifiers];
  //console.log(`begin test unit '${u}'`); 
  if (units === undefined) {
    units = [u];
    allUnitsEver = new Set();
    allUnitsEver.add(unitDescr(u));
  } else {
    const ud = unitDescr(u);
    if (allUnitsEver.has(ud)) {
      throw new Error("Unit has already been created before: '" + ud + "'.");
    }
    units.push(u);
  }
}

/**
 * @returns {string[]?}
 */
export function currentUnit() {
  if (units === undefined || units.length === 0) return null;
  else return units[units.length - 1]; 
}

/**
 * @param {string} packageName
 * @param {string[]} qualifiers
 */
export function endUnit(packageName, ...qualifiers) {
  const u = [packageName, ...qualifiers];
  //console.log(`end test unit '${u}'`); 
  if (!eq(currentUnit(), u)) {
    throw new Error(`no match for ending test unit '${u}'`);
  }
  units.pop();
}

/**
 * @param {string?} descr
 * @param {() => void} tc
 */ 
export function test(descr, tc) {
  //console.log(`adding test '${descr}', current unit is '${currentUnit()}'`);
  currentTestCase.add(descr, tc);
}

/**
 * @param {boolean} value
 * @param {string=} descr
 */
export function assert(value, descr) {
  currentTestCase.checkCanAssert();
  if (!descr) {
    currentTestCase.assert(value);
  } else {
    currentTestCase.add(String(descr), () => assert(value));
  }
}

/**
 * @param {boolean} value
 * @param {string=} descr
 */
export function assertTrue(value, descr) {
  assert(value, descr);
}

/**
 * @param {boolean} value
 * @param {string=} descr
 */
export function assertFalse(value, descr) {
  assert(value === false, descr);
}

/**
 * @param {*} value1
 * @param {*} value2
 * @param {string=} descr
 */
export function assertEq(value1, value2, descr) {
  assert(eq(value1, value2), descr);
}

/**
 * @param {*} value1
 * @param {*} value2
 * @param {string=} descr
 */
export function assertNEq(value1, value2, descr) {
  assert(!eq(value1, value2), descr);
}

/**
 * @param {() => *} lazyValue
 * @param {string=} descr
 */
export function assertThrow(lazyValue, descr) {

  if (lazyValue instanceof Function) {
    test(descr ?? null, async () => {
      try {
        await lazyValue();
        assert(false);
      } catch (error) {
        assert(true);
      }
    });
  } else {
    assert(false, descr);
  }
}

/**
 * @param {() => *} lazyValue
 * @param {string=} descr
 */
 export function assertLazy(lazyValue, descr) {
  if (lazyValue instanceof Function) {
    test(descr ?? null, async () => {
      assert(await lazyValue());
    });
  } else {
    assert(false, descr);
  }
}

let testsAreRunning = false;

/**
 * @param {string | string[] | ((unit: string[]) => boolean)} unitFilter 
 * @returns {(unit: string[]) => boolean}
 */
function normaliseUnitFilter(unitFilter) {
  function error() { throw new Error("invalid unit filter"); }
  switch (typeof unitFilter) {
    case "function": return unitFilter;
    case "string": return u => u[0] === unitFilter;
    case "object": 
      /** @type {string[]} */
      let v = [];
      for (const s of unitFilter) {
        if (typeof s === "string") v.push(s);
        else error();
      }
      return u => {
        if (v.length > u.length) return false;
        for (const [i, s] of u.entries()) {
          if (s !== v[i]) return false;
        }
        return true;
      };
  }
  error();
}

/**
 * @param {string | string[] | ((unit: string[]) => boolean)} unitFilter 
 * @param {(s : string) => void} log
 */
export async function runTests(unitFilter, log) {
  if (testsAreRunning) { 
    console.log("... tests are alreading running, ignoring call to runTests ...");
    return false;
  }
  testsAreRunning = true;
  try {
    log("Running tests ...");
    await currentTestCase.run(normaliseUnitFilter(unitFilter));
    log("---------------------------------------------------------------");
    currentTestCase.log(0, "", log);
    log("---------------------------------------------------------------");
    log(currentTestCase.summaryInfo());
    log("");
    let cu = currentUnit();
    if (cu) throw new Error("Dangling unit: '" + unitDescr(cu) + "'");
  } finally {
    testsAreRunning = false;
  }
  return currentTestCase.successful();
}

/** @param {*} obj */
export function lockClass(obj) {
  Object.freeze(obj);
  Object.freeze(obj.prototype);
}

/** @param {*} obj */
export function lockFunc(obj) {
  Object.freeze(obj);
}

export function lockdown() {
  lockClass(Object);
  lockFunc(test);
  lockFunc(assert);
  lockFunc(assertTrue);
  lockFunc(assertEq);
  lockFunc(assertNEq);
  lockFunc(assertThrow);
  lockFunc(assertLazy);
  lockFunc(runTests);
  lockFunc(lockClass);
  lockFunc(lockFunc);
  lockFunc(lockdown);
  lockFunc(eq);
  lockFunc(beginUnit);
  lockFunc(endUnit);
  lockFunc(currentUnit);
}

