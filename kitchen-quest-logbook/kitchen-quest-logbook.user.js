// ==UserScript==
// @name         Kitchen Quest Logbook
// @namespace    https://github.com/Camilra/neo-scripts/tree/main/kitchen-quest-logbook
// @description  Record your Kitchen Quest reward.
// @icon         https://images.neopets.com/items/toy_kitchenquest_flotsam.gif
// @version      1.2.1
// @author       Camilra
// @match        http*://www.neopets.com/island/kitchen.phtml*
// @match        http*://www.neopets.com/~camilra
// @match        http*://www.neopets.com/~Camilra
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(() => {
    "use strict";

    const start = + new Date();

    var KQ;
    KQ = GM_getValue("Kitchen_Quest");
    if (!KQ) {
        KQ = [];
        GM_setValue("Kitchen_Quest", KQ);
    };

    /**************************************** Kitchen ****************************************/

    // class entry
    class Entry {
        constructor (type, target, value, original) {
            this.original = original;
            this.type = type;
            this.target = target;
            this.value = value;
            this.timestamp = new Date().getTime();
            this.nst = this.getDate();
        };

        getDate () {
            const [date, month, year] = new Date().toLocaleDateString("en-GB", { timeZone: "America/Los_Angeles" }).split("/");
            return { year: + year, month: + month, date: + date };
        };
    };

    // summary styling
    function createKitchenStyle () {
        const style = document.createElement("style");
        style.innerText = `
                #icon{
                    display: inline-block;
                    background-image: url(https://images.neopets.com/themes/h5/basic/images/v3/transferlog-icon.svg);
                    background-position: center;
                    background-size: 105%;
                    width: 30px;
                    height: 30px;
                    position: relative;
                    cursor: pointer;
                }
                #summary{
                    display: flex;
                    flex-wrap: wrap;
                    visibility: hidden;
                    opacity: 0;
                    background-color: #feecc7;
                    font-family: "MuseoSansRounded700", 'Arial', sans-serif;
                    width: 255px;
                    height: auto;
                    padding: 10px;
                    border: solid 3px #633e06;
                    border-radius: 10px;
                    position: absolute;
                    top: 34px;
                    pointer-events: none;
                    transform-origin: 50% 0;
                    transform: scaleY(0.1);
                    transition: 0.25s;
                }
                #summary.on{
                    visibility: visible;
                    opacity: 1;
                    transform: scaleY(1);
                    transition: 0.25s;
                }
                #summary > h1{
                    font-family: "Cafeteria", 'Arial Bold', sans-serif;
                    font-size: 1.2rem;
                    width: 100%;
                    height: fit-content;
                    margin: 0;
                }
                #summary > h2{
                    font-size: 1rem;
                    font-weight: bold;
                    width: 100%;
                    height: fit-content;
                    margin: 0;
                }
                #summary > .icon{
                    background-size: 25px 25px;
                    width: 25px;
                    height: 25px;
                }
                #summary > .data{
                    display: flex;
                    align-items: center;
                    width: calc(100% - 35px);
                    padding-left: 10px;
                }
                #summary > .data a{
                    color: #5d2fc9;
                    text-decoration: none;
                    pointer-events: all;
                }
                #success{
                    visibility: hidden;
                    opacity: 0;
                    display: flex;
                    justify-content: center;
                    width: 100%;
                    height: 35px;
                    margin: 10px 0;
                    cursor: default;
                }
                #success.done{
                    visibility: visible;
                    opacity: 1;
                }
                #success .wrapper{
                    display: flex;
                    height: 100%;
                }
                #success .wrapper .tick{
                    background-size: 35px 35px;
                    width: 35px;
                    height: 35px;
                }
                #success .wrapper .text{
                    display: flex;
                    align-items: center;
                    font-family: "MuseoSansRounded700", 'Arial', sans-serif;
                    color: #057300;
                    width: max-content;
                    padding-left: 10px;
                }
            `;
        document.body.appendChild(style);
    };

    // summary script
    function createKitchenScript () {
        const script = document.createElement("script");
        script.innerText = `
            function showSummary () {
                document.querySelector("#summary").classList.toggle("on");
            };
        `;
        document.body.appendChild(script);
    };

    // trim reward
    function rewardLog (original) {
        const regex = [/You have been given | Neopoints as a reward/g, /You get a /g, / has gained a /g, / has become better at /g],
            match = original.replaceAll("!", "");
        for (let index = 0; index < regex.length; index++) {
            const result = match.split(regex[index]);
            if (result.length > 1) {
                dataProcess(original, result, index);
                break;
            };
        };
    };

    // create entry
    function dataProcess (original, result, index) {
        const keys = { "level": "lv", "hit point": "hp", "Attack": "atk", "Defence": "def", "Agility": "spd" };
        let type = "", target = result[0] || undefined, value;
        switch (index) {
            case 0:
                type = "np";
                value = + result[1];
                break;
            case 1:
                type = "item";
                value = result[1];
                break;
            case 2:
            case 3:
                type = "stat";
                value = keys[result[1]];
        };
        dataEntry(new Entry(type, target, value, original));
    };

    // push entry
    function dataEntry (entry) {
        KQ.push(entry);
        GM_setValue("Kitchen_Quest", KQ);
        const success = document.querySelector("#success");
        success.classList.add("done");
    };

    // sum total
    function sumTotal (KQ) {
        const keys = { "lv": 1, "hp": 1, "atk": 1, "def": 1, "spd": 1 },
            active = document.querySelector("a.profile-dropdown-link").innerText || document.body.querySelector(".sidebarHeader.medText").innerText,
            sum = { "amount": 0, "item": 0, "lv": 0, "hp": 0, "atk": 0, "def": 0, "spd": 0 };
        KQ.forEach(entry => {
            switch (entry.type) {
                case "np":
                    sum.amount += entry.value;
                    break;
                case "item":
                    sum.item += 1;
                    break;
                case "stat":
                    if (entry.target === active) {
                        sum[entry.value] += keys[entry.value];
                    };
            };
        });
        return [active, sum];
    };

    // inside kitchen
    if (window.location.href.toLowerCase().includes("neopets.com/island/kitchen.phtml")) {
        if (document.querySelector("#navnewsdropdown__2020")) {
            createKitchenStyle();
            createKitchenScript();
            const container = document.querySelector("#container__2020"),
                observer = new MutationObserver(record => {
                    if (record[0].addedNodes.length === 12 || record[0].addedNodes.length === 13) {
                        const reward = record[0].addedNodes[record[0].addedNodes.length === 12 ? 10 : 11],
                            original = reward.innerText;
                        reward.outerHTML += `
                            <div id="success">
                                <div class="wrapper">
                                    <div class="tick" style="background-image: url(https://images.neopets.com/neggfest/y23/np/negg-found.svg)"></div>
                                    <div class="text">Your entry has been successfully added!</div>
                                </div>
                            <div>
                        `;
                        rewardLog(original);
                    };
                });
            observer.observe(container, { childList: true });
            if (KQ) {
                const [active, { amount, item, lv, hp, atk, def, spd }] = sumTotal(KQ),
                    nav = document.querySelector(".navsub-left__2020");
                nav.innerHTML += `
                    <div id="icon" onclick="showSummary()">
                        <div id="summary">
                            <h1>Kitchen Quest reward in total:</h1>
                            <div class="icon" style="background-image: url(https://images.neopets.com/themes/h5/basic/images/np-icon.svg)"></div>
                            <div class="data">${ amount } NP</div>
                            <div class="icon" style="background-image: url(https://images.neopets.com/themes/h5/basic/images/hunger-icon.png)"></div>
                            <div class="data">${ item } Items</div>
                            <h1>Active pet ${ active } has gained:</h1>
                            <div class="icon" style="background-image: url(https://images.neopets.com/themes/h5/basic/images/level-icon.png)"></div>
                            <div class="data">${ lv } Level</div>
                            <div class="icon" style="background-image: url(https://images.neopets.com/themes/h5/basic/images/health-icon.png)"></div>
                            <div class="data">${ hp } Hit Points</div>
                            <div class="icon" style="background-image: url(https://images.neopets.com/themes/h5/basic/images/equip-icon.png)"></div>
                            <div class="data">${ atk } Attack</div>
                            <div class="icon" style="background-image: url(https://images.neopets.com/themes/h5/basic/images/customise-icon.svg)"></div>
                            <div class="data">${ def } Defence</div>
                            <div class="icon" style="background-image: url(https://cdn.discordapp.com/emojis/594698006067019826.png)"></div>
                            <div class="data">${ spd } Speed</div>
                            <h2>For full report please visit petpage</h2>
                            <div class="icon" style="background-image: url(https://pets.neopets.com/cp/3n9jz9vg/1/6.png)"></div>
                            <div class="data"><a href="/~Camilra" target="_blank">Camilra</a></div>
                        </div>
                    </div>
                `;
            };
        };
    };

    /**************************************** Kitchen ****************************************/


    /**************************************** Report ****************************************/


    // class report
    class Report {
        raw = [];
        select;
        csv = ``;
        temporary = [];
        lookup = [];
        pages = {};
        elements = {};
        frequency = {};
        constructor () {
            this.getDestination = this.getDestination;
            this.setDestination = this.setDestination;
            this.resetDestination = this.resetDestination;
            this.createPages = this.createPages;
            this.createElements = this.createElements;
            this.pickerMoveTo = this.pickerMoveTo;
            this.pickerCopyFrom = this.pickerCopyFrom;
            this.errorMessage = {
                zeroEntries: `You don't have any entry, finish a Kitchen Quest first!\nhttps://www.neopets.com/island/kitchen.phtml`,
                missingEntries: (text) => `You don't have entries of this ${ text }!`,
                copyFailed: `Failed to copy from report!\nDo not have permission to write to the clipboard.`
            };
            this.successMessage = {
                copySucceed: (year, month) => `Record of ${ month } ${ year } has been copied into your clipboard.`
            };
        };

        createPages (KQ = []) {
            this.pages = {}, this.lookup = [];
            let i = 0, k = 0;
            while (KQ[k] && KQ[i].nst.year === KQ[k].nst.year) {
                const page = {};
                while (KQ[k] && KQ[i].nst.year === KQ[k].nst.year && KQ[i].nst.month === KQ[k].nst.month) {
                    const section = {};
                    while (KQ[k] && KQ[i].nst.year === KQ[k].nst.year && KQ[i].nst.month === KQ[k].nst.month && KQ[i].nst.date === KQ[k].nst.date) {
                        const batch = [];
                        while (KQ[k] && KQ[i].nst.year === KQ[k].nst.year && KQ[i].nst.month === KQ[k].nst.month && KQ[i].nst.date === KQ[k].nst.date) {
                            batch.push(KQ[k]);
                            k++;
                        };
                        i = k;
                        const [{ year, month, date }, sum] = this.sumThis(batch);
                        section[`${ date } - ${ month } - ${ year }`] = sum;
                        if (KQ[k] && (KQ[i - 1].nst.month !== KQ[k].nst.month || KQ[i - 1].nst.year !== KQ[k].nst.year)) break;
                    };
                    page[KQ[i - 1].nst.month] = section;
                    if (KQ[k] && KQ[i - 1].nst.year !== KQ[k].nst.year) break;
                };
                this.pages[KQ[i - 1].nst.year] = page;
            };
            Object.freeze(this.pages);
            this.raw = KQ;
            this.lookup = Object.keys(this.pages);
            this.elements = {};
            this.frequency = {};

            const createPicker = () => {
                const titles = [null, "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
                    picker = document.querySelector("#picker .buttons"),
                    select = this.createNode("", "", "", 0, "select"),
                    fieldset = this.createNode("", "", "", undefined, "fieldset"),
                    action = document.querySelector("#picker .action"),
                    copy = this.createNode("<div>Copy</div>", "copy", "", undefined, "button"),
                    current = this.getDestination();
                if (picker && picker.hasChildNodes()) picker.textContent = "";
                if (action && action.hasChildNodes()) action.textContent = "";
                this.select = select;
                select.addEventListener("change", () => {
                    const yearIndex = select.value;
                    this.setDestination(yearIndex, 0)
                        .pickerActive(yearIndex, 0)
                        .renderElements(yearIndex);
                });
                copy.addEventListener("click", () => { this.pickerCopyFrom(); });
                picker.append(select, fieldset);
                action.append(copy);
                this.lookup.forEach((yearLabel, yearIndex) => {
                    const option = this.createNode(yearLabel, "", "", undefined, "option"),
                        field = this.createNode("", "year", "", undefined);
                    option.value = yearIndex;
                    select.append(option);
                    fieldset.append(field);
                    Object.keys(this.pages[yearLabel]).forEach((monthLabel, monthIndex) => {
                        const month = this.createNode(titles[monthLabel], current[1] !== monthIndex ? "pick" : "pick active", "", undefined, "button");
                        month.addEventListener("click", () => {
                            this.setDestination(yearIndex, monthIndex)
                                .pickerActive(yearIndex, monthIndex);
                        });
                        field.append(month);
                    });
                });
            };

            const createExport = () => {
                const exports = document.querySelector("#export"),
                    form = exports.querySelector("form");
                if (form && form.hasChildNodes()) form.textContent = "";
                const container = this.createNode("", "options"),
                    table = this.createNode("", "table", "", undefined, "fieldset"),
                    csv = this.createNode("", "csv", "", undefined, "fieldset"),
                    json = this.createNode("", "json", "", undefined, "fieldset"),
                    submit = this.createNode("Export", "", "", 0, "button");
                submit.type = "button";
                table.append(this.createNode("Export Table", "title"));
                csv.append(this.createNode("Export CSV", "title"));
                json.append(this.createNode("Export JSON", "title"));
                container.append(table, csv, json);
                if (table) {
                    const checkGroup = this.createNode("", "check-group");
                    table.append(checkGroup);
                    for (let i = 0; i < this.lookup.length; i++) {
                        const label = this.createNode("", "", "", undefined, "label"),
                            check = this.createNode("", "TABLE", "", 0, "input"),
                            text = this.createNode(`Year ${ this.lookup[i] }`);
                        check.type = "checkbox";
                        check.value = i;
                        label.append(check, text);
                        checkGroup.append(label);
                    };
                };
                if (csv) {
                    const label = this.createNode("", "", "", undefined, "label"),
                        check = this.createNode("", "CSV", "", 0, "input"),
                        text = this.createNode("Kitchen Quest Entries");
                    check.type = "checkbox";
                    label.append(check, text);
                    csv.append(label);
                };
                if (json) {
                    const label = this.createNode("", "", "", undefined, "label"),
                        check = this.createNode("", "JSON", "", 0, "input"),
                        text = this.createNode("Kitchen Quest Entries");
                    check.type = "checkbox";
                    label.append(check, text);
                    json.append(label);
                };
                submit.addEventListener("click", () => {
                    this.exportDownload(form);
                });
                form.append(container);
                form.append(submit);
            };

            if (this.lookup.length) {
                createPicker();
                createExport();
            } else {
                this.displayError(this.errorMessage.zeroEntries);
            }

            return this;
        };

        createElements (yearIndex = this.getDestination()[0], separator = "\t") {
            const titles = [null, "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
                rewards = ["Date", "Np amount", "Np", "Item", "Lv", "Hp", "Atk", "Def", "Spd", "Total"],
                total = { amount: 0, np: 0, item: 0, lv: 0, hp: 0, atk: 0, def: 0, spd: 0, count: 0 },
                frequency = { lv: {}, hp: {}, atk: {}, def: {}, spd: {} },
                page = this.createNode("", "", "page");
            if (!this.lookup[yearIndex]) yearIndex = this.resetDestination().getDestination()[0];
            const year = this.lookup[yearIndex];
            if (!year) {
                page.classList.add("zero");
                page.innerText = "You don't have any entry, finish a Kitchen Quest first!";
                this.elements["zero"] = page;
            } else {
                const article = this.createNode("", "year"),
                    title = this.createNode(year, "title"),
                    foot = this.createNode("", "foot");
                article.append(title, "\n");
                for (const month in this.pages[year]) {
                    const section = this.createNode("", "month"),
                        head = this.createNode("", "head"),
                        title = this.createNode(titles[month], "title"),
                        column = this.createNode("", "row sticky"),
                        foot = this.createNode("", "foot"),
                        overall = this.createNode("", "row", "", 0),
                        odds = this.createNode("", "row", "", 0),
                        sub = { amount: 0, np: 0, item: 0, lv: 0, hp: 0, atk: 0, def: 0, spd: 0, count: 0 };
                    for (let i = 0; i < rewards.length; i++) {
                        const classes = i ? Object.keys(total)[i - 1] : "",
                            reward = this.createNode(rewards[i], `column ${ classes }`);
                        i < rewards.length - 1 ? column.append(reward, separator) : column.append(reward);
                    };
                    head.append(title, "\n", column, "\n");
                    section.append(head);
                    for (const date in this.pages[year][month]) {
                        const entry = this.createNode("", "row", "", 0);
                        entry.append(this.createNode(date));
                        for (const props in this.pages[year][month][date]) {
                            const content = this.pages[year][month][date][props];
                            sub[props] += content;
                            if (frequency[props] !== undefined) frequency[props][content] === undefined ? frequency[props][content] = 1 : frequency[props][content]++;
                            entry.append(separator, this.createNode(content, props));
                        };
                        section.append(entry, "\n");
                    };
                    overall.append(this.createNode("Month Total"));
                    odds.append(this.createNode("Odds"));
                    odds.append(separator, this.createNode("-", "amount"));
                    for (const props in sub) {
                        total[props] += sub[props];
                        overall.append(separator, this.createNode(sub[props], props));
                        if (props !== "amount") odds.append(separator, this.createNode(`${ Math.round(sub[props] / sub.count * 10000) / 100 }%`, props));
                    };
                    foot.append(overall, "\n", odds, "\n");
                    section.append(foot);
                    article.append(section);
                };
                const overall = this.createNode("", "row", "", 0),
                    odds = this.createNode("", "row", "", 0);
                overall.append(this.createNode("Year Total"));
                odds.append(this.createNode("Odds"));
                odds.append(separator, this.createNode("-", "amount"));
                for (const props in total) {
                    overall.append(separator, this.createNode(total[props], props));
                    if (props !== "amount") odds.append(separator, this.createNode(`${ Math.round(total[props] / total.count * 10000) / 100 }%`, props));
                };
                foot.append(overall, "\n", odds, "\n");
                article.append(foot);
                page.append(article);
                this.elements[year] = page;
                this.frequency[year] = frequency;
            };
            return this;
        };

        renderElements (yearIndex = this.getDestination()[0]) {
            const space = document.querySelector("#report");
            let yearLabel;
            space.textContent = "";
            if (yearLabel = this.hasElements(yearIndex)) {
                space.append(this.elements[yearLabel]);
                this.renderFrequency(this.frequency[yearLabel]);
            } else {
                space.append(this.elements.zero);
                this.renderFrequency();
            };
            return this;
        };

        renderFrequency (frequency) {
            const space = document.querySelector("#camilra .frequency");
            if (space) space.textContent = "";
            if (space && frequency) {
                let string = `<div class="title">Stats Frequency</div>`;
                for (const type in frequency) {
                    string += `
                            <div class="block">
                                <div class="title">${ type }:</div>
                        `;
                    for (const stat in frequency[type]) {
                        string += `
                                <div class="stat">
                                    <div>${ stat }</div>
                                    <div>${ frequency[type][stat] } time(s)</div>
                                </div>
                            `;
                    };
                    string += `
                            </div>
                        `;
                }
                space.innerHTML = string;
            };
        }

        getDestination () {
            let yearIndex = sessionStorage.getItem("Current Year"),
                monthIndex = sessionStorage.getItem("Current Month");
            if (yearIndex === null || monthIndex === null) {
                yearIndex = 0;
                monthIndex = 0;
                this.resetDestination();
            }
            return [+ yearIndex, + monthIndex];
        };

        setDestination (yearIndex, monthIndex) {
            sessionStorage.setItem("Current Year", yearIndex);
            sessionStorage.setItem("Current Month", monthIndex);
            return this;
        };

        resetDestination () {
            sessionStorage.setItem("Current Year", 0);
            sessionStorage.setItem("Current Month", 0);
            return this;
        }

        pickerActive (yearIndex, monthIndex) {
            if (yearIndex === undefined || monthIndex === undefined) [yearIndex, monthIndex] = this.getDestination();
            const years = document.querySelectorAll("#picker .buttons .year"),
                buttons = document.querySelectorAll("#picker .buttons .year .pick");
            years.forEach(year => {
                year.classList.remove("active");
            });
            buttons.forEach(button => {
                button.classList.remove("active");
            });
            if (years[yearIndex]) {
                this.select.value = yearIndex;
                years[yearIndex].classList.add("active");
                const month = years[yearIndex].querySelectorAll(".pick")[monthIndex];
                if (month) {
                    month.classList.add("active");
                    this.pickerMoveTo();
                } else {
                    this.displayError(this.errorMessage.missingEntries("month"));
                }
            } else {
                this.displayError(this.errorMessage.missingEntries("year"));
            }
            return this;
        };

        pickerMoveTo () {
            const year = document.querySelector("#page .year"),
                monthIndex = this.getDestination()[1],
                month = year?.querySelectorAll(".month")[monthIndex];
            if (year && month) {
                year.scrollTop = monthIndex === 0 ? 0 : year.querySelectorAll(".month")[monthIndex].offsetTop;
            }
            return this;
        };

        pickerCopyFrom () {
            const [yearIndex, monthIndex] = this.getDestination();
            let yearLabel;
            if (yearLabel = this.hasElements(yearIndex)) {
                const months = this.elements[yearLabel].querySelectorAll(".month"),
                    month = months[monthIndex];
                if (month) {
                    const monthLabel = month.querySelector(".title").innerText,
                        data = month.textContent,
                        write = window.navigator.clipboard.writeText(data);
                    write.then(resolve => {
                        this.displaySuccess(this.successMessage.copySucceed(yearLabel, monthLabel));
                    }).catch(error => {
                        this.displayError(this.errorMessage.copyFailed);
                    });
                } else {
                    this.displayError(this.errorMessage.missingEntries("month"));
                };
            } else {
                this.displayError(this.errorMessage.missingEntries("year"));
            };
            return this;
        };

        exportDownload (form) {
            const inputs = form.querySelectorAll("input[type=checkbox]");
            for (let input of inputs) {
                if (input.checked) this[`export${ input.classList[0] }`](input.value);
            };
            return this;
        };

        exportTABLE (yearIndex = this.getDestination()[0]) {
            let yearLabel;
            if (yearLabel = this.hasElements(yearIndex)) {
                const data = this.elements[yearLabel].textContent.replaceAll("\t", ","),
                    file = new Blob([data], { type: "text/csv" }),
                    url = URL.createObjectURL(file),
                    anchor = this.createNode("", "table", "", undefined, "a");
                anchor.href = url;
                anchor.download = `kitchen-quest-logbook-report-${ yearLabel }.csv`;
                this.fireClick(anchor);
            }
            return this;
        };

        exportCSV () {
            if (!this.csv) {
                const data = 1;
            } else {
                const data = this.csv;
            };
            const data = (() => {
                if (!this.csv) {
                    let head = ["timestamp", "nst", "original", "target", "type", "value"].join(","),
                        entries = this.raw.map((entry) => {
                            return [
                                entry.timestamp,
                                Object.values(entry.nst).join("-"),
                                entry.original,
                                entry.target,
                                entry.type,
                                entry.value
                            ].join(",");
                        });
                    entries.unshift(head);
                    return entries.join("\n");
                } else {
                    return this.csv;
                }
            })(),
                file = new Blob([data], { type: "text/csv" }),
                url = URL.createObjectURL(file),
                anchor = this.createNode("", "csv", "", undefined, "a");
            anchor.href = url;
            anchor.download = `kitchen-quest-logbook-entries.csv`;
            console.log(data);
            this.fireClick(anchor);
            return this;
        };

        exportJSON () {
            const data = JSON.stringify({ Kitchen_Quest: this.raw }),
                file = new Blob([data], { type: "application/json" }),
                url = URL.createObjectURL(file),
                anchor = this.createNode("", "json", "", undefined, "a");
            anchor.href = url;
            anchor.download = `kitchen-quest-logbook-entries.json`;
            this.fireClick(anchor);
            return this;
        };

        hasElements (yearIndex) {
            const yearLabel = this.lookup[yearIndex];
            if (yearLabel) {
                if (!this.elements.hasOwnProperty(yearLabel)) {
                    this.createElements(yearIndex);
                };
                return yearLabel;
            } else {
                this.displayError(this.errorMessage.zeroEntries);
                return false;
            };
        };

        fireClick (anchor) {
            anchor.addEventListener("click", () => {});
            anchor.dispatchEvent(new MouseEvent("click", {
                bubbles: true,
                cancelable: true
            }));
        };

        sumThis (batch) {
            const keys = { "lv": 1, "hp": 1, "atk": 1, "def": 1, "spd": 1 },
                date = batch[0].nst,
                sum = { "amount": 0, "np": 0, "item": 0, "lv": 0, "hp": 0, "atk": 0, "def": 0, "spd": 0, "count": 0 };
            batch.forEach(entry => {
                switch (entry.type) {
                    case "np":
                        sum.amount += entry.value;
                        sum.np += 1;
                        break;
                    case "item":
                        sum.item += 1;
                        break;
                    case "stat":
                        sum[entry.value] += keys[entry.value];
                };
                sum.count++;
            });
            return [date, sum];
        };

        createNode (content, classes = "", id = "", tabindex, tag = "div") {
            const element = document.createElement(tag);
            if (content === 0 || content) element.innerHTML = content;
            if (classes) {
                classes.trim().split(/[\s]+/g).forEach(type => {
                    element.classList.add(type);
                });
            };
            if (id) element.id = id;
            if (tabindex !== undefined) element.setAttribute("tabindex", tabindex);
            return element;
        };

        displaySuccess (message = "") {
            alert(message);
        };

        displayError (message = "") {
            alert(message);
        };
    };

    // report layout
    function createReportLayout () {
        let title = document.head.querySelector("title");
        if (!title) title = document.createElement("title"), document.head.append(title);
        title.innerText = "Neopets - Kitchen Quest Logbook";
        document.body.innerHTML = `
            <header>
                <div class="background">
                    <div class="hegelob"></div>
                    <div class="hegelob"></div>
                    <div class="hegelob"></div>
                    <div class="hegelob"></div>
                    <div class="hegelob"></div>
                </div>
                <nav>
                    <div class="left">
                        <div class="camilra">
                            <button class="tag toggle">
                                <div class="icon"></div>
                            </button>
                            <div class="dropdown">
                                <div id="camilra">
                                    <div class="background">
                                        <div class="hegelob"></div>
                                    </div>
                                    <div class="frequency"></div>
                                </div>
                            </div>
                        </div>
                        <div class="quote">
                            <div>
                                <span class="page"></span>
                                <span class="report"></span>
                            </div>
                        </div>
                    </div>
                    <div class="right">
                        <div class="kitchen">
                            <a class="tag" href="island/kitchen.phtml" target="_self" tabindex="0">
                                <div class="icon"></div>
                                <div class="text">Back to Kitchen</div>
                            </a>
                        </div>
                        <div class="export">
                            <button class="tag toggle">
                                <div class="icon"></div>
                                <div class="text">Export</div>
                            </button>
                            <div class="dropdown">
                                <div id="export">
                                    <div class="background">
                                        <div class="hegelob"></div>
                                    </div>
                                    <form></form>
                                </div>
                            </div>
                        </div>
                        <div class="picker">
                            <button class="tag toggle">
                                <div class="icon"></div>
                                <div class="text">Move To</div>
                                <div class="arrow"></div>
                            </button>
                            <div class="dropdown">
                                <div id="picker">
                                    <div class="background">
                                        <div class="hegelob"></div>
                                    </div>
                                    <div class="buttons"></div>
                                    <div class="action"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>
            </header>
            <main>
                <div id="report"></div>
            </main>
            <footer>
                <div class="pattern"></div>
                <div class="copyright">
                    NEOPETS and all related indicia are trademarks of Neopets, Inc., © 1999-${ new Date().getUTCFullYear() }. ® denotes Reg. USPTO. All rights reserved.
                </div>
                <div class="links">
                    <div class="link">
                        <a href="terms.phtml" target="_blank">Terms of Use</a>
                    </div>
                    <div class="link">
                        <a href="privacy.phtml" target="_blank">Privacy Policy</a>
                    </div>
                    <div class="link">
                        <a href="https://www.jumpstart.com/support/np-classic" target="_blank">Support</a>
                    </div>
                </div>
            </footer>
            <section class="overlay"></section>
        `;
    };

    // report styling
    function createReportStyle () {
        const style = document.createElement("style");
        style.innerText += `
            *{box-sizing:border-box;cursor:default}::before,::after{display:block}a,a *,button,button *,label,label *{cursor:pointer !important}a{text-decoration:none;color:unset}button,select{background-color:rgba(0,0,0,0);background-image:none;font-family:inherit;font-size:100%;font-weight:inherit;text-transform:none;line-height:inherit;color:inherit;padding:0;margin:0;border:0}html{background-color:#362831;background-image:url(https://i.imgur.com/bWAVtvj.jpg);background-repeat:no-repeat;background-size:cover;background-position:center center;background-attachment:fixed}html::-webkit-scrollbar{display:none;width:0}:root{--white-80: rgba(255, 255, 255, 80%);--body-font-family: "MuseoSansRounded700", "Arial Bold", sans-serif;--body-title-font-family: "Cafeteria", "Arial Bold", sans-serif;--body-color: #fdcc01;--body-text-color: #2c0000;--ribbon: linear-gradient(90deg, #fdcc01 0%, #ffff66 12.5%, #fdcc01 25%, #d4aa00 37.5%, #bb9601 50%, #d4aa00 62.5%, #fdcc01 75%, #ffff66 82.5%, #fdcc01 100%);--header-height: 68px;--header-decoration-background-image: linear-gradient(45deg, #100a12 0%, #1d1420 20%, #3a2941 40%, #1d1420 60%, #160e17 80%, #100a12 100%);--header-arrow-background-image: url(https://images.neopets.com/themes/h5/newyears/images/dropdown-arrow.svg);--header-camilra-icon: url(https://pets.neopets.com/cp/7zssdrnt/1/1.png);--header-dropdown-background: linear-gradient(0deg, #705a82 0%, #886d9f 16.67%, #b490d2 33.33%, #c099df 50%, #daaeff 66.67%, #f8e0ff 83.33%, #daaeff 100%);--header-dropdown-pattern: url(https://gist.githubusercontent.com/Camilra/89bb7b1767c6e82369ba5f01d88eddfa/raw/878e967ebd442e4e78c2057d3a2055658ec6a961/vine.svg);--header-picker-background-image: linear-gradient(0deg, #100a12 0%, #3a2941 100%);--header-picker-button-border: #705A83;--header-picker-button-outline: #fdcc01;--header-picker-action-button-background-image: url(https://gist.githubusercontent.com/Camilra/32969190af24447eae8d29ebfe6418fc/raw/3045a6f9eb2ffe99eca95c2d09ab42bafab5525a/button-pattern-dark.svg);--header-picker-action-button-image: url(https://gist.githubusercontent.com/Camilra/d3634393599cbfd1cd2a4129ad1c5658/raw/7024ad848808a5daa7ef0c8d1ff292fb2c01914b/button-dark.svg);--footer-decoration-background-image: url(https://i.imgur.com/YnA0kqn.jpg)}:focus-visible{border-radius:4px;outline-style:solid;outline-width:2px;outline-color:var(--body-color)}body{background-image:var(--body-background-image);background-repeat:no-repeat;background-size:cover;background-position:center center;background-attachment:fixed;font-family:var(--body-font-family);color:var(--body-color);margin:0;animation-name:report;animation-duration:.5s;animation-fill-mode:forwards}.hegelob{height:100px;width:100px;position:absolute;clip-path:path("M 67.134 0 c 0.283 0.077 0.562 0.172 0.849 0.228 c 1.43 0.282 2.724 0.764 3.762 1.889 c 1.561 1.693 3.2 3.315 4.828 4.946 c 3.164 3.171 6.965 4.96 11.456 5.254 c 0.276 0.018 0.715 0.218 0.762 0.41 c 0.067 0.279 -0.07 0.832 -0.265 0.913 c -0.938 0.385 -1.912 0.862 -2.895 0.917 c -2.924 0.161 -5.79 -0.207 -8.417 -1.675 c -0.032 0.099 -0.086 0.175 -0.066 0.216 c 1.634 3.353 3.826 6.253 6.916 8.407 c 2.415 1.683 4.895 3.231 7.759 4.077 c 1.542 0.455 3.048 0.679 4.602 0.096 c 0.46 -0.172 0.959 -0.241 1.441 -0.358 c 0.042 0.09 0.084 0.179 0.126 0.269 c -0.987 0.48 -1.939 1.058 -2.968 1.42 c -3.161 1.114 -6.288 0.73 -9.406 -0.311 c -4.414 -1.474 -8.23 -3.882 -11.615 -7.058 c -1.205 -1.13 -2.598 -2.06 -3.916 -3.066 c -0.142 -0.108 -0.357 -0.122 -0.778 -0.254 c 0.41 0.643 0.713 1.089 0.986 1.554 c 1.199 2.039 0.715 3.016 -1.939 3.297 c 1.178 1.2 2.172 2.302 3.262 3.299 c 0.981 0.896 1.027 0.846 0.448 2.145 c -0.529 -0.067 -1.074 -0.137 -1.756 -0.224 c 0.983 1.072 1.711 2.302 2.789 2.908 c 0.941 0.529 2.281 0.477 3.438 0.442 c 0.64 -0.02 0.769 -0.763 0.603 -1.37 c -0.189 -0.691 -0.434 -1.368 -0.664 -2.083 c 1.791 0.722 3.152 2.406 3.06 3.883 c -0.121 1.945 -1.913 2.216 -3.423 3.289 c 1.862 0.017 3.489 0.187 5.075 -0.001 c 1.462 -0.172 2.404 -1.227 2.413 -2.168 c 0.01 -1.086 -1.168 -2.314 -2.513 -2.625 c -0.245 -0.056 -0.487 -0.122 -0.976 -0.245 c 0.407 -0.202 0.584 -0.36 0.772 -0.372 c 1.872 -0.13 3.568 0.205 4.883 1.726 c 0.987 1.141 1.297 2.372 0.81 3.8 c -1.1 3.22 -3.741 4.764 -7.139 4.199 c -3.747 -0.623 -6.895 -2.458 -9.681 -4.919 c -1.331 -1.176 -2.444 -2.597 -3.611 -3.857 c -0.565 0.635 -1.111 1.488 -1.871 2.052 c -1.463 1.088 -3.025 2.052 -4.59 2.997 c -2.024 1.222 -4.109 2.343 -6.128 3.573 c -0.755 0.46 -1.397 1.106 -2.18 1.74 c 4.376 2.623 8.841 3.875 13.823 2.645 c -0.332 -1.517 -1.414 -2.3 -2.83 -2.687 c -1.243 -0.339 -2.511 -0.59 -3.746 -0.979 c 2.588 0.319 5.373 -0.22 7.625 1.572 c 0.865 0.688 1.665 1.537 2.261 2.463 c 0.666 1.034 0.366 1.944 -0.595 2.72 c -1.031 0.833 -2.248 1.066 -3.54 1.185 c -1.607 0.147 -3.219 0.349 -4.794 0.685 c -1.792 0.382 -2.656 1.672 -2.803 3.447 c -0.02 0.241 0.141 0.56 0.32 0.743 c 0.465 0.474 0.987 0.891 1.712 1.529 c -0.494 -0.143 -0.729 -0.167 -0.919 -0.273 c -1.754 -0.988 -3.419 -0.423 -5.081 0.268 c -0.69 0.287 -0.94 0.764 -0.969 1.547 c -0.043 1.161 0.247 2.111 0.93 3.054 c 1.055 1.456 2.06 2.962 2.931 4.532 c 0.524 0.944 0.804 2.036 1.095 3.089 c 0.132 0.477 0.022 1.02 -0.188 1.54 c -0.08 -0.436 -0.175 -0.869 -0.235 -1.306 c -0.28 -2.062 -1.184 -3.66 -2.803 -5.096 c -2.235 -1.982 -4.48 -3.883 -7.147 -5.245 c -0.458 -0.234 -0.942 -0.419 -1.583 -0.701 c 0.424 2.578 0.958 4.915 2.039 7.06 c 1.39 2.759 2.634 5.643 5.032 7.745 c 0.851 0.745 1.808 1.368 2.717 2.045 c 0.053 0.04 0.131 0.054 0.171 0.102 c 1.326 1.58 2.501 3.252 2.864 5.338 c 0.099 0.566 -0.283 0.815 -0.822 0.573 c -0.937 -0.42 -1.855 -0.885 -2.891 -1.303 c 2.9 3.415 3.485 7.635 3.604 11.774 c 0.119 4.147 -0.656 8.289 -3.685 11.876 c -0.38 -3.733 -0.728 -7.145 -1.076 -10.557 c -0.13 -0.004 -0.261 -0.008 -0.391 -0.013 c -0.16 0.879 -0.412 1.753 -0.464 2.639 c -0.213 3.636 -2.301 6.152 -4.885 8.393 c -0.068 0.061 -0.106 0.156 -0.158 0.235 c -0.334 0 -0.667 0 -1.002 0 c -0.31 -1.392 -0.252 -2.67 0.782 -3.833 c 0.299 -0.336 0.197 -1.03 0.28 -1.56 c -0.355 0.048 -0.493 0.172 -0.633 0.295 c -0.969 0.851 -1.887 1.772 -2.92 2.537 c -1.413 1.045 -3 1.562 -4.797 1.133 c -1.937 -0.463 -3.52 -1.566 -5.01 -2.8 c -0.302 -0.25 -0.304 -0.862 -0.445 -1.308 c 0.107 -0.066 0.214 -0.133 0.321 -0.2 c -4.615 -2.111 -8.116 -5.351 -10.206 -9.959 c -2.293 0.809 -9.255 -5.53 -8.939 -8.023 c 1.542 -0.463 2.752 0.456 4.181 1.234 c -0.111 -0.387 -0.12 -0.522 -0.183 -0.623 c -2.737 -4.348 -6.558 -7.281 -11.469 -8.809 c -0.324 -0.101 -0.571 -0.45 -0.854 -0.684 c 0.27 -0.299 0.496 -0.667 0.824 -0.876 c 0.258 -0.165 0.643 -0.131 0.97 -0.19 c 0.722 -0.13 1.443 -0.264 2.315 -0.424 c -2.855 -2.421 -5.667 -4.461 -9.171 -5.327 C 0.591 60.498 0.311 60.147 0 59.92 c 0 -0.2 0 -0.401 0 -0.601 c 0.892 -0.866 1.975 -1.072 3.186 -1.05 c 3.06 0.056 5.847 0.603 8.393 2.614 c 2.783 2.198 5.122 4.65 6.737 7.8 c 1.262 2.462 2.552 4.911 3.835 7.362 c 0.147 0.283 0.329 0.547 0.572 0.95 c 0.397 -1.024 0.728 -1.889 1.07 -2.749 c 1.131 -2.849 3.061 -4.616 6.229 -5.071 c 2.566 -0.368 4.95 -0.304 7.201 1.146 c 1.32 0.85 2.233 1.978 2.404 3.508 c 0.178 1.581 0.289 3.209 0.112 4.781 c -0.394 3.498 -3.09 5.82 -6.632 5.688 c -1.798 -0.067 -3.581 -0.53 -5.327 -0.808 c 0.483 2.852 5.177 6.798 8.292 6.865 c 1.316 0.028 2.636 -0.149 3.576 -1.021 c 1.335 -1.236 2.706 -2.557 3.619 -4.103 c 2.435 -4.124 1.951 -10.589 -1.21 -14.189 c -2.899 -3.303 -6.157 -6.291 -9.256 -9.418 c -0.179 -0.181 -0.365 -0.363 -0.51 -0.57 c -0.366 -0.523 -0.605 -1.197 -1.083 -1.569 c -2.368 -1.849 -3.852 -4.177 -4.227 -7.183 c -0.054 -0.429 -0.146 -0.855 -0.24 -1.278 c -0.938 -4.268 -0.956 -8.371 1.81 -12.112 c 1.725 -2.333 3.535 -4.58 6.27 -5.717 c 2.981 -1.239 5.677 -3.145 9.044 -3.514 c 3.242 -0.355 6.448 -1.044 9.665 -1.617 c 0.473 -0.084 0.916 -0.335 1.436 -0.533 c -0.87 -0.591 -1.527 -1.106 -2.247 -1.509 c -0.888 -0.497 -1.779 -1.045 -2.796 -0.098 c -0.424 0.395 -1.082 0.54 -1.765 0.859 c 0 -0.584 0 -0.946 0 -1.414 c -0.944 0.848 -1.792 1.609 -2.689 2.416 c -0.208 -0.453 -0.336 -0.731 -0.635 -1.382 c -0.7 0.844 -1.223 1.538 -1.813 2.17 c -0.746 0.8 -1.166 0.703 -1.55 -0.294 c -0.417 -1.083 -0.83 -2.167 -1.219 -3.184 c -1.624 0.528 -3.137 1.188 -4.719 1.5 c -2.869 0.566 -5.783 0.902 -8.667 1.403 c -0.43 0.075 -1.008 0.447 -1.15 0.822 c -0.531 1.399 -1.913 2.216 -3.236 1.476 c -1.178 -0.659 -1.769 -0.092 -2.463 0.61 c -1.709 1.729 -2.388 3.966 -2.992 6.221 c -0.186 0.696 -0.236 1.455 -0.206 2.178 c 0.086 2.083 2.486 3.576 4.438 2.805 c 1.112 -0.439 1.495 -1.168 1.206 -2.303 c -0.156 -0.614 -0.317 -1.227 -0.497 -1.923 c 2.161 0.682 2.454 0.939 2.589 2.185 c 0.16 1.485 -0.86 3.724 -2.098 4.274 c -1.818 0.808 -3.356 1.348 -5.142 -0.3 c -2.555 -2.36 -3.285 -4.718 -2.052 -7.975 c 0.46 -1.215 0.886 -2.443 1.353 -3.655 c 0.254 -0.662 0.433 -1.413 0.874 -1.929 c 0.764 -0.896 1.704 -1.641 2.654 -2.526 c -0.239 -0.207 -0.505 -0.439 -0.773 -0.67 c -1.619 -1.388 -2.265 -3.165 -1.763 -5.209 c 1 -4.069 5.004 -7.406 9.799 -6.107 c 1.719 0.465 3.36 1.247 4.996 1.976 c 1.171 0.521 2.246 0.071 3.309 -0.217 c 0.286 -0.078 0.386 -0.843 0.571 -1.292 c 0.038 -0.092 0.056 -0.205 0.122 -0.27 c 1.032 -1.03 2.069 -2.054 3.236 -3.207 c -0.024 -0.138 -0.156 -0.496 -0.134 -0.844 c 0.061 -1.013 0.084 -2.044 0.314 -3.023 c 0.169 -0.721 1.293 -0.987 1.793 -0.52 c 0.68 0.635 1.441 1.232 1.95 1.991 c 0.691 1.027 1.585 1.203 2.667 1.061 c 0.229 -0.03 0.452 -0.108 0.679 -0.158 c 2.941 -0.648 5.158 -2.415 7.08 -4.619 c 0.15 -0.172 0.25 -0.575 0.154 -0.747 c -0.603 -1.076 -0.165 -2.08 0.185 -3.063 c 0.398 -1.12 1.152 -1.503 2.357 -1.42 c 1.219 0.084 2.501 0.385 3.646 0.12 C 61.726 1.417 63.002 0.602 64.329 0 C 65.264 0 66.199 0 67.134 0 Z M 30.973 83.011 c 0.922 0.105 1.815 -0.369 2.573 -1.136 c 1.288 -1.304 1.961 -2.912 2.261 -4.695 c 0.208 -1.237 -0.026 -2.379 -0.689 -3.446 c -0.345 -0.555 -0.768 -0.833 -1.466 -0.818 c -1.03 0.021 -2.075 -0.197 -3.091 -0.094 c -0.704 0.072 -1.634 0.318 -2.005 0.824 c -1.308 1.778 -2.295 3.764 -2.281 6.051 c 0.003 0.584 0.202 1.369 0.607 1.71 C 27.977 82.33 29.252 83.015 30.973 83.011 Z M 24.216 22.889 c 0.805 -0.31 2.081 0.502 2.102 1.336 c 0.018 0.696 0.227 1.005 1.041 0.787 c 1.891 -0.509 3.805 -0.938 5.719 -1.355 c 1.582 -0.344 3.178 -0.624 4.846 -0.948 c -0.81 -1.58 -1.814 -1.119 -2.97 -0.52 c 0.205 -1.099 -0.397 -1.115 -1.033 -1.222 c -2.029 -0.341 -4.035 -0.931 -6.073 -1.071 c -1.911 -0.131 -3.853 0.186 -5.78 0.315 c -0.221 0.015 -0.538 0.02 -0.641 0.157 c -0.907 1.204 -1.857 2.45 -1.577 4.058 c 0.095 0.545 0.668 1.055 1.121 1.475 c 0.351 0.324 0.854 0.483 1.44 0.795 C 24.537 25.557 24.886 24.887 24.216 22.889 Z")}header{background-image:var(--ribbon);font-size:17pt;width:100%;height:var(--header-height);position:sticky;top:0;z-index:99}header * :not(.quote,.quote *){-moz-user-select:none;-webkit-user-select:none;user-select:none}header>.background{display:flex;justify-content:center;align-items:center;background-image:var(--header-decoration-background-image);width:100%;height:65px;position:absolute;overflow:hidden}header>.background .hegelob:nth-child(1){background-image:linear-gradient(305deg, #47324f 0%, #5e4369 16.67%, #735080 33.33%, #8a609a 50%, #735080 66.67%, #5e4369 83.33%, #47324f 100%);transform:translate(-6vw, 10%) scale(0.6) rotate(-60deg)}header>.background .hegelob:nth-child(2){background-image:linear-gradient(30deg, #47324f 0%, #5e4369 40%, #735080 80%, #8a609a 100%);transform:translate(-14vw, -30%) scale(0.6) rotate(30deg)}header>.background .hegelob:nth-child(3){background-image:linear-gradient(30deg, #47324f 0%, #5e4369 40%, #735080 80%, #8a609a 100%);transform:translate(-13vw, 40%) scale(0.6) rotate(-150deg)}header>.background .hegelob:nth-child(4){background-image:linear-gradient(30deg, #47324f 0%, #5e4369 60%, #735080 80%, #8a609a 100%);transform:translate(1vw, -10%) scale(0.6) rotate(-170deg)}header>.background .hegelob:nth-child(5){background-color:#47324f;transform:translate(-21vw, 17%) scale(0.6) rotateZ(175deg)}header nav{display:flex;justify-content:space-between;width:100%;height:65px;padding:5px 10px;position:absolute}header nav .left,header nav .right{display:grid;grid-auto-flow:column;gap:0 10px}header nav .left>div,header nav .right>div{display:flex;align-items:center;position:relative}header nav .left>div .tag,header nav .right>div .tag{display:flex;justify-content:center;align-items:center;font-family:var(--body-title-font-family);height:100%}header nav .left>div .tag:hover,header nav .right>div .tag:hover{transform:scale(1.1)}header nav .left>div .tag.toggle.active .arrow,header nav .right>div .tag.toggle.active .arrow{transform:rotateZ(-180deg)}header nav .left>div .tag.disable,header nav .right>div .tag.disable{filter:brightness(0.6);cursor:unset;pointer-events:none}header nav .left>div .tag.disable *,header nav .right>div .tag.disable *{cursor:unset}header nav .left>div .tag.disable:hover,header nav .left>div .tag.disable :hover,header nav .right>div .tag.disable:hover,header nav .right>div .tag.disable :hover{transform:unset}header nav .left>div .tag .icon,header nav .right>div .tag .icon{background-repeat:no-repeat;background-size:100%;width:40px;height:40px}header nav .left>div .tag .icon:hover,header nav .right>div .tag .icon:hover{transform:rotateZ(-10deg)}header nav .left>div .tag .text,header nav .right>div .tag .text{width:max-content;margin-left:10px}header nav .left>div .tag .arrow,header nav .right>div .tag .arrow{background-image:var(--header-arrow-background-image);background-repeat:no-repeat;background-size:100%;background-position:center center;width:18px;height:18px;margin-left:10px;transform:rotateZ(0deg);transition:.25s}header nav .left .camilra .tag,header nav .right .camilra .tag{width:50px;height:50px;border-radius:50%;overflow:hidden}header nav .left .camilra .tag:hover,header nav .right .camilra .tag:hover{transform:unset}header nav .left .camilra .tag .icon,header nav .right .camilra .tag .icon{background-image:var(--header-camilra-icon);width:100%;height:100%}header nav .left .camilra .tag .icon:hover,header nav .right .camilra .tag .icon:hover{transform:unset}header nav .left .camilra .tag.active+.dropdown,header nav .right .camilra .tag.active+.dropdown{visibility:visible;transform:translateX(0)}header nav .left .camilra .dropdown,header nav .right .camilra .dropdown{visibility:hidden;font-size:.8rem;width:317px;padding-right:15px;border-right:solid 2px #3e3148;position:fixed;top:var(--header-height);bottom:0;left:0;transform:translateX(-100%);transition:.25s;z-index:98}header nav .left .camilra .dropdown::before,header nav .right .camilra .dropdown::before{content:"";background-image:var(--header-dropdown-pattern),var(--header-dropdown-background);background-repeat:no-repeat repeat;background-size:15px auto,auto;background-position:right center,left center;position:absolute;top:0;bottom:0;left:0;right:0;z-index:-1}header nav .camilra .tag{width:50px;height:50px;border-radius:50%;overflow:hidden}header nav .camilra .tag:hover{transform:unset}header nav .camilra .tag .icon{background-image:var(--header-camilra-icon);width:100%;height:100%}header nav .camilra .tag .icon:hover{transform:unset}header nav .camilra .tag.active+.dropdown{visibility:visible;transform:translateX(0)}header nav .camilra .dropdown{visibility:hidden;font-size:.8rem;width:317px;padding-right:15px;border-right:solid 2px #3e3148;position:fixed;top:var(--header-height);bottom:0;left:0;transform:translateX(-100%);transition:.25s;z-index:98}header nav .camilra .dropdown::before{content:"";background-image:var(--header-dropdown-pattern),var(--header-dropdown-background);background-repeat:no-repeat repeat;background-size:15px auto,auto;background-position:right center,left center;position:absolute;top:0;bottom:0;left:0;right:0;z-index:-1}header nav .quote{background-color:var(--white-80);font-size:.9rem;white-space:nowrap;color:var(--body-text-color);width:fit-content;height:fit-content;padding:10px 20px;margin:auto 0;border-radius:10px}header nav .quote::before{content:"";width:0;height:0;border-top:solid 5px rgba(0,0,0,0);border-bottom:solid 5px rgba(0,0,0,0);border-right:solid 6px rgba(255,255,255,.8);position:absolute;left:-6px}header nav .quote>div{display:block;display:-webkit-box;overflow:hidden;text-overflow:ellipsis;line-clamp:1}header nav .kitchen .tag .icon{background-image:url(https://images.neopets.com/themes/h5/newyears/images/signout-icon.png)}header nav .export .tag .icon{background-image:url(https://images.neopets.com/themes/h5/newyears/images/quickstock-icon.png)}header nav .export .tag.active+.dropdown{display:flex}header nav .export .tag.active+.dropdown #export{display:flex;animation-name:export;animation-duration:.5s;animation-fill-mode:forwards}header nav .export .dropdown{display:none;justify-content:center;align-items:center;background-color:rgba(0,0,0,0);position:fixed;top:var(--header-height);bottom:0;left:0;right:0;transform:translateY(-100vh);z-index:98}header nav .picker .tag .icon{background-image:url(https://images.neopets.com/themes/h5/newyears/images/calendar-icon.png)}header nav .picker .tag.active+.dropdown{visibility:visible;transform:translateX(0)}header nav .picker .tag.active+.dropdown #picker .buttons fieldset .year.active{visibility:visible;opacity:1}header nav .picker .dropdown{visibility:hidden;font-size:.8rem;width:317px;padding-left:15px;border-left:solid 2px #3e3148;position:fixed;top:var(--header-height);bottom:0;right:0;transform:translateX(100%);transition:.25s;z-index:98}header nav .picker .dropdown::before{content:"";background-image:var(--header-dropdown-pattern),var(--header-dropdown-background);background-repeat:no-repeat repeat;background-size:15px auto,auto;background-position:left center,right center;position:absolute;top:0;bottom:0;left:0;right:0;z-index:-1}#camilra{color:var(--white-80)}#camilra>.background{transform:scaleX(-1)}#camilra .frequency .title{font-family:var(--body-title-font-family);font-size:1.5rem;text-transform:capitalize}#camilra .frequency .block{display:flex;flex-direction:column}#camilra .frequency .block:not(:first-child){margin-top:15px}#camilra .frequency .block>div{width:100%}#camilra .frequency .block .stat{display:flex;justify-content:space-between;margin-top:5px}#export{visibility:hidden;opacity:0;display:none;font-family:var(--body-title-font-family);font-size:1rem;color:var(--white-80);width:600px;height:500px;border-radius:15px}#export form{display:flex;flex-direction:column;justify-content:space-between;align-items:center;width:100%;height:100%;margin:0;overflow-y:auto;overflow-x:hidden}#export form .options{display:flex;flex-direction:column;width:100%}#export form .options fieldset{width:100%;padding:0;border:0;margin:0}#export form .options fieldset:not(:first-child){margin-top:15px}#export form .options fieldset .title{font-size:1.5rem;margin-bottom:15px}#export form .options fieldset .check-group{display:flex;flex-wrap:wrap;row-gap:10px}#export form .options fieldset .check-group label{flex:1 1 25%;width:100%;max-width:25%}#export form .options fieldset label{display:flex;align-items:center;width:fit-content}#export form .options fieldset label input[type=checkbox]{appearance:none;display:flex;justify-content:center;align-items:center;width:20px;height:20px;margin:0;margin-right:15px;border:solid 2px var(--white-80);border-radius:2px;position:relative}#export form .options fieldset label input[type=checkbox]:checked::before{display:block;content:"✓";font-size:2rem;color:var(--body-color);position:absolute}#export form button{font-size:1.5rem}#picker .buttons{display:flex;flex-direction:column;align-items:center}#picker .buttons select{display:flex;justify-content:center;align-items:center;text-align:center;width:100px;margin-bottom:20px;cursor:pointer}#picker .buttons fieldset{display:flex;min-inline-size:auto;width:100%;margin:0;padding:0;border:0}#picker .buttons fieldset .year{visibility:hidden;opacity:0;display:grid;grid-template-columns:repeat(2, 1fr);grid-template-rows:repeat(6, 1fr);gap:20px;width:100%;margin-right:-100%}#picker .buttons fieldset .year .pick{display:flex;justify-content:center;align-items:center}#picker .buttons select,#picker .buttons fieldset .year .pick{font-family:var(--body-font-family);background-color:var(--white-80);color:var(--body-text-color);padding:7.5px;border-radius:5px}#picker .buttons select:focus-visible,#picker .buttons fieldset .year .pick:focus-visible{outline-offset:2px}#picker .buttons select.active,#picker .buttons fieldset .year .pick.active{background-color:var(--header-picker-button-border);color:#fff}#picker .action{display:flex;flex-direction:column;align-items:center;font-family:var(--body-title-font-family)}#picker .action button{display:flex;justify-content:center;align-items:center;font-size:1.5rem;width:200px;padding:1rem;border-image-source:var(--header-picker-action-button-image);border-image-width:50% auto;border-image-slice:50% fill;border-image-outset:0;border-image-repeat:stretch;border-radius:3px;outline:solid 1px var(--header-picker-button-border)}#picker .action button:hover div,#picker .action button:focus-visible div{transform:scale(1.1)}#picker .action button:active div{transform:scale(1)}#picker .action button div{display:flex;justify-content:center;align-items:center}#picker .action button div::before{content:"";background-image:var(--header-picker-action-button-background-image);background-repeat:no-repeat;background-size:100%;width:1.875rem;height:1.5rem;margin-right:.5rem}#camilra,#picker{display:flex;flex-direction:column;justify-content:space-between;width:100%;height:100%;overflow-y:auto;overflow-x:hidden}#camilra,#export,#picker{background-image:var(--header-picker-background-image);padding:30px;position:relative;z-index:-1}#camilra>.background,#export>.background,#picker>.background{display:flex;justify-content:center;align-items:center;position:absolute;top:0;bottom:0;left:0;right:0;z-index:-1}#camilra>.background .hegelob,#export>.background .hegelob,#picker>.background .hegelob{background-image:linear-gradient(0deg, #47324f 0%, #5e4369 100%);transform:translateX(13px) scale(2) rotateZ(-25deg)}main{min-height:calc(100vh - 158px);padding:50px 0;margin:auto}#report{font-size:.9rem;color:var(--body-text-color);width:100%;max-width:760px;padding:50px 30px;border-image-source:url(https://images.neopets.com/neggfest/y23/np/questlog-body.svg);border-image-width:70px 62px;border-image-slice:70 62 fill;border-image-outset:0;border-image-repeat:stretch;margin:auto;filter:brightness(1.05)}#page{opacity:0;display:flex;width:100%;height:550px;position:relative;left:0;transition:.4s;animation-name:report;animation-duration:.5s;animation-fill-mode:forwards}#page.zero{display:flex;justify-content:center;align-items:center;font-family:var(--body-title-font-family);font-size:2rem;text-align:center;line-height:1.5;width:auto;height:300px}#page .year{display:flex;flex-direction:column;align-items:center;width:100%;max-width:700px;padding:0 20px;overflow-x:hidden;overflow-y:auto;scroll-behavior:smooth}#page .year::-webkit-scrollbar{width:0}#page .year .title{display:flex;justify-content:center;align-items:center;font-family:var(--body-title-font-family);font-size:1.2rem;line-height:1.5;position:relative}#page .year .row{display:grid;grid-template-columns:minmax(max-content, 14fr) 14fr 9fr 9fr 9fr 9fr 9fr 9fr 9fr 9fr}#page .year .row div{display:flex;justify-content:flex-end;padding:5px 0}#page .year .row:not(.sticky):focus,#page .year .row:not(.sticky):focus-visible,#page .year .row:not(.sticky):hover{border-radius:0;outline:0}#page .year .row:not(.sticky):focus div,#page .year .row:not(.sticky):focus-visible div,#page .year .row:not(.sticky):hover div{background-color:#c5af76}#page .year .row:not(.sticky):focus div:first-child,#page .year .row:not(.sticky):focus-visible div:first-child,#page .year .row:not(.sticky):hover div:first-child{border-radius:4px 0 0 4px}#page .year .row:not(.sticky):focus div:last-child,#page .year .row:not(.sticky):focus-visible div:last-child,#page .year .row:not(.sticky):hover div:last-child{border-radius:0 4px 4px 0}#page .year .month .head{background-color:#dcc484;position:sticky;top:0}#page .year .month .head .row{border-top:solid 2px #2c0000;border-bottom:solid 2px #2c0000}#page .year .month .head .row .column{justify-content:center}#page .year .foot .row{border-top:solid 2px #2c0000}#page .year .foot .row div:first-child{justify-content:flex-start}#page .year .month,#page .year>.foot{width:100%;padding-top:15px;position:relative}footer{background-image:var(--ribbon);text-align:center;width:100%;position:relative;overflow:hidden}footer .pattern{background-color:#2a2017;background-image:var(--footer-decoration-background-image);background-repeat:no-repeat;background-size:cover;background-position:bottom center;width:100%;height:100%;position:absolute;top:3px}footer .copyright{font-size:10pt;max-width:90%;margin:20px auto 10px;position:relative}footer .links{display:flex;justify-content:center;flex-wrap:wrap;font-size:16pt;font-family:var(--body-title-font-family);width:90%;max-width:350px;margin:auto auto 20px;position:relative}footer .links .link{display:inline-block;max-width:50%;margin:auto 10px;cursor:pointer}section.overlay{opacity:.5;display:none;background-color:#000;position:fixed;top:0;bottom:0;left:0;right:0;z-index:97;cursor:pointer}section.overlay.active{display:block}@font-face{font-family:"Cafeteria";src:url(https://images.neopets.com/js/fonts/cafeteria-black.ttf) format("truetype");src:url(https://images.neopets.com/js/fonts/cafeteria-black.otf) format("opentype");font-display:swap}@font-face{font-family:"MuseoSansRounded700";font-style:normal;src:url(https://images.neopets.com/js/fonts/museosansrounded-700.woff) format("woff"),url(https://images.neopets.com/js/fonts/museosansrounded-700.ttf) format("truetype");font-display:swap}@keyframes report{0%{opacity:0}100%{opacity:1}}@keyframes export{0%{visibility:hidden;opacity:0;transform:translateY(0)}100%{visibility:visible;opacity:1;transform:translateY(100vh)}}@media screen and (max-width: 1024px){header nav .tag .text,.quote{display:none !important}}@media screen and (max-width: 768px){#page .year{padding:0}#page .year .row{grid-template-columns:minmax(max-content, 14fr) 14fr 10fr 10fr 10fr 10fr 10fr 10fr 10fr}#page .year .row .count{display:none}}@media screen and (max-width: 520px){#page .year{padding:0}#page .year .row{grid-template-columns:14fr 10fr 10fr 10fr 10fr 10fr 10fr 10fr}#page .year .row .amount{display:none}}/*# sourceMappingURL=kq.css.map */
        `;
        document.body.appendChild(style);
    };

    // nav toggle
    function navToggle () {
        tags.forEach(tag => {
            tag.addEventListener("click", () => {
                if (tag.classList.contains("toggle")) {
                    toggleDropdown(tag);
                };
            });
        });
        overlay.addEventListener("click", () => {
            cancelDropdown();
        });
    };

    // toggle dropdown
    function toggleDropdown (tag) {
        if (!tag.classList.contains("active")) {
            cancelDropdown();
        };
        tag.classList.toggle("active");
        overlay.classList.toggle("active");
    };

    // cancel dropdown
    function cancelDropdown () {
        tags.forEach(tag => {
            tag.classList.remove("active");
        });
        overlay.classList.remove("active");
    };

    // stop timer
    function stopTimer (start) {
        const end = + new Date();
        return (end - start) / 1000;
    };

    // on report page
    if (window.location.href.toLowerCase().includes("/~camilra")) {
        createReportLayout();
        createReportStyle();

        const quote = document.querySelectorAll("header nav .quote span");
        var tags = document.querySelectorAll("header nav div .tag"),
            overlay = document.querySelector("section.overlay");

        window.setTimeout(() => {
            const report = new Report()
                .createPages(KQ),
                [year, month] = report.getDestination();
            let yearIndex;

            if ((year || month) === 0) {
                let index = report.lookup.indexOf("" + new Date().getFullYear());
                if (index >= 0) {
                    yearIndex = index;
                    report.setDestination(yearIndex, 0);
                };
            };

            report.createElements(yearIndex)
                .renderElements();

            if (report.lookup.length) report.pickerActive();

            quote[1].innerHTML = report.lookup.length ? `and ${ stopTimer(start) }s to prepare report for you.` : `and failed to prepare report for you.`;
        }, 0);

        navToggle();
        quote[0].innerHTML = `I took ${ stopTimer(start) }s to prepare the page&nbsp;`;
    };

    /**************************************** Report ****************************************/

})();
