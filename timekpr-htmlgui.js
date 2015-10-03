
/* Simple HTML UI for the timekpr-server.
 *
 * Using this UI is not necessary for using
 * the timekpr-server: using the local /usr/bin/timekpr-gui
 * will work too and changes will be synced to all the configured devices.
 */


/*
 * Code Structure:
 * The UI is implemented using React including the JSX-Extension.
 *
 * There are the following Components:
 * - TimekprBox: the View/Control, handing inputs and updates
 * - UserList: just adds a User component for every user
 * - User: the View (per user). This is the modification and submit form
 * - DeviceList: adds a Device component for every device
 * - Device: Shows the last sync-timestamp for the device
 */


/* all visible strings are marked for translation */
var Tr = {
  tr: function (txt) {
    return txt;
  }
};

/*
 * TimekprBox: View/Controler
 *
 * - updating the state (getInitialState, receivedData)
 * - update the state from the server (updateIfUnchanged)
 * - HTTP-requests (updateFromServer, sendToServer)
 * - handling "actions" (click, typing events)
 * - render: passing the information to the UserList
 */
var TimekprBox = React.createClass({
  getInitialState: function () {
    this.userData = {};
    this.devices = {};
    this.error = null;
    return {data: this.userData };
  },
  receivedData: function (json_text) {
      var j;
      try {
        j = JSON.parse(json_text);
      }
      catch (e) {
        j = { "error": "got invalid config: " + e};
      }
      var userData = {};
      for (k in j.users) {
        userData[k] = {};
        userData[k].config = j.users[k];
        userData[k].changed = {};
      }
      this.userData = userData;
      this.devices = j.devices || {};
      this.last_change = j.last_change
      if (j.error != null) {
        this.error = j.error;
      }

      this.setState({data: this.userData });
  },
  sendToServer: function (j) {
    var httpPost = function (theUrl, jobj, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
          if (xhr.readyState == 4 && xhr.status == 200)
            callback(xhr.responseText);
        };
        xhr.open("POST", theUrl, true);
        /* every server is able to handle url-encoded data,
         * don't require as json-ready server */
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send("json=" + encodeURI(JSON.stringify(jobj)));
    };
    httpPost("/timekpr/setdata.lua", j, this.receivedData);
  },
  updateIfUnchanged: function () {
    /* only pull the current server data,
     * if we aren't in the middle of an edit
     * (yes, this can result in 'bonus' minutes
     * for logged in users)
     *
     * Alternative:
     * Always get the data from the server and
     * apply our changes to the server config.
     */
    var changedSomething = false;
    for (k in this.userData) {
      for (ck in this.userData[k].changed) {
        changedSomething = true;
        break;
      }
      if (changedSomething) break;
    }
    if (!changedSomething) {
      this.updateFromServer();
    }
  },
  updateFromServer: function() {
    var httpGet = function (theUrl, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
          if (xhr.readyState == 4 && xhr.status == 200)
            callback(xhr.responseText);
        };
        xhr.open("GET", theUrl, true);
        xhr.send(null);
    };
    httpGet("/timekpr/getdata.lua", this.receivedData);
  },
  handleAction: function (command, user, info) {
    if (command == "changed") {
      var changed = false;
      /* each user attribut can be changed */
      for (key in info) {
        /* check if the attribute was really changed,
         * if so, mark that attribute as changed for
         * a visual clue in the user interface */
        if (this.userData[user].config[key] != info[key]) {
          this.userData[user].config[key] = info[key];
          this.userData[user].changed[key] = true;
          changed = true;
        }
      }
      /* the state changed, if at least one attribute changed */
      if (changed) {
          this.setState({data: this.userData });
      }
    }
    else if (command == "add") {
      if (this.userData[user] != null) {
        /* error message? ... */
        this.error = "Cannot add user >" + user + "<. User already exists."
        this.setState({data: this.userData});
        return;
      }
      this.userData[user] = {};
      this.userData[user].config = {
        userlocked: true,
        limit: 0,
        time: 0,
      };
      this.userData[user].changed = {
        userlocked: true,
        limit: true,
        time: true,
      };
      this.setState({data: this.userData});
    }
    else if (command == "submit") {
      /* did we change something? */
      var changedSomething = false;
      for (k in this.userData) {
        for (ck in this.userData[k].changed) {
          changedSomething = true;
          break;
        }
        if (changedSomething) break;
      }
      if (!changedSomething) {
        return;
      }
      /* generate json for the server */
      var j = { users: {} };
      for (k in this.userData) {
        j.users[k] = this.userData[k].config;
      }
      var d = new Date();
      j["last_change"] = (new Date()).toISOString().slice(0, 19)
      j["devices"] = this.devices;
      this.sendToServer(j);
    }

  },
  componentDidMount: function() {
    this.updateFromServer();
    setInterval(this.updateIfUnchanged, 3000);
  },
  render: function() {
    return (
      <div className="timekprBox">
        <h1>{Tr.tr("TimeKeeper HTML UI")}</h1>
        <div>
          <span>{Tr.tr("Last timestamp:")} </span>
          <span>{this.last_change}</span>
        </div>
        <ErrorMessage error={this.error} />
        <h2>{Tr.tr("Users")}</h2>
        <UserList data={this.userData} handleAction={this.handleAction} />
        <h2>{Tr.tr("Devices")}</h2>
        <DeviceList data={this.devices} lastChange={this.last_change} />
      </div>
    );
  },
});

/* Show error message (if there are any) */
var ErrorMessage = React.createClass({
  render: function () {
    if (this.props.error == null) {
      return (
        <div>
          <span> No Errors.</span>
        </div>
      );
    }
    else {
      return (
        <div>
          <span>Error: </span>
          <span className="error-message">{this.props.error}</span>
        </div>
      );
    }
  },
});

/*
 * Main view component.
 *
 * - forward events to the View/Controler (via the handleAction callback)
 * - recalculate the user time after reward/penalty clicks
 * - UI in JSX (render function)
 */
var User = React.createClass({
  /* handle function, there should be a DRY-way ... how could userData
   * be passed to handleAction, to use handleAction in the DOM/callback 
   * directly?
   */
  handleSubmit: function (e) {
    e.preventDefault();
    this.props.handleAction("submit", this.props.name, {});
  },
  handleOpenAccount: function () {
    this.props.handleAction("changed", this.props.name, {userlocked:false});
  },
  handleLockAccount: function () {
    this.props.handleAction("changed", this.props.name, {userlocked:true});
  },
  handleNewLimit: function () {
    var limit = React.findDOMNode(this.refs.limit).value;
    this.props.handleAction("changed", this.props.name, { limit: limit*60 });
  },
  handleTimeMod: function (e) {
    e.preventDefault();

    /* get values from the form */
    mod = e.currentTarget.name == "add" ? 1 : -1;
    var currTime = React.findDOMNode(this.refs.time).textContent;
    var change = React.findDOMNode(this.refs.timeChange).value;
    if (change === "") {
      /* no value set? -> no nothing */
      return;
    }

    /* string to number and change time */
    var currTimeN = Number(currTime);
    var changeN = Number(change);
    var time = currTimeN + Math.abs(changeN) * mod;

    /* update model */
    this.props.handleAction("changed", this.props.name, {time: time*60});
    /* clear value in the form */
    React.findDOMNode(this.refs.timeChange).value = "";
  },
  render: function () {
    return (
    <div className="userContainer">
      <div className="user">
        <h3 className="userName">{this.props.name ? this.props.name : Tr.tr("<unnamed>")}</h3>
        <form onSubmit={this.handleSubmit}>
          <div>
            <label className={this.props.data.changed['userlocked'] == true ? "modified" : "unchanged"}>{Tr.tr("Account:")} </label>
            <span>
              <label>
                <input type="radio" id="open" value="open" checked={this.props.data.config["userlocked"] == false} ref="open" onChange={this.handleOpenAccount} />
                {Tr.tr("open")}
              </label>
              <label>
                <input type="radio" id="locked" value="locked" checked={this.props.data.config["userlocked"] == true} ref="locked" onChange={this.handleLockAccount} />
                {Tr.tr("locked")}
              </label>
            </span>
          </div>
          <div>
            <span className={this.props.data.changed["limit"] == true ? "modified" : "unchanged"}>{Tr.tr("Daily Limit:")} </span>
              <input type="number" value={this.props.data.config["limit"] / 60} ref="limit" onChange={this.handleNewLimit} />
          </div>
          <div>
            <span className={this.props.data.changed["time"] === true ? "modified" : "unchanged"} >{Tr.tr("Time used:")}</span><span ref="time">{this.props.data.config["time"] / 60}</span>
          </div>
          <div>
            <span className={this.props.data.changed["time"] === true ? "modified" : "unchanged"} >{Tr.tr("Time left:")}</span><span>{(this.props.data.config["limit"] - this.props.data.config["time"]) / 60}</span>
          </div>
          <div>
            <label>
              <span>{Tr.tr("Change time:")} </span>
              <input type="number" placeholder={Tr.tr("in minutes ...")} ref="timeChange" />
            </label>
          </div>
          <div className="userTimeButtons">
            <button name="sub" onClick={this.handleTimeMod}>{Tr.tr("Reward")}</button>
            <button name="add" onClick={this.handleTimeMod}>{Tr.tr("Penalty")}</button>
          </div>
          <div>
            <input type="submit" value={Tr.tr("Submit")} />
          </div>
        </form>
      </div>
    </div>
    );
  },
});

/*
 * Render every user using the User component.
 * Pass the props to the User components.
 * Adds new users.
 */
var UserList = React.createClass({
  addUser: function(e) {
    e.preventDefault();
    var newUser = React.findDOMNode(this.refs.newUserName).value;
    this.props.handleAction("add", newUser, {});
    /* clear name field */
    React.findDOMNode(this.refs.newUserName).value = "";
  },
  render: function() {
    var users = [];
    Object.keys(this.props.data).forEach(key => {
      users.push(
        <User name={key} key={key} data={this.props.data[key]} handleAction={this.props.handleAction} />
      );
    });
    return (
      <div className="userList">
        <input placeholder={Tr.tr("user name ...")} ref="newUserName" />
        <button name="adduser" onClick={this.addUser}>{Tr.tr("Add User")}</button>
        {users}
      </div>
    );
  },
});

/*
 * Render every user using the User component.
 * Pass the props to the User components.
 */
var DeviceList = React.createClass({
  render: function() {
    var devices = [];
    Object.keys(this.props.data).forEach(key => {
      devices.push(
        <Device name={key} key={key} data={this.props.data[key]} lastChange={this.props.lastChange} />
      );
    });
    return (
      <div className="deviceList">
        {devices}
      </div>
    );
  },
});

var Device = React.createClass({
  tr: function (txt) {
    /* here could be the entry point for translations */
    return txt;
  },
  render: function () {
    return (
      <div className="device">
        <h3 className="deviceName">{this.props.name}</h3>
          <div>
            <span>{Tr.tr("Sync-Timestamp:")} </span>
            <span className={this.props.lastChange == this.props.data["checked_change"] ? "up-to-date" : "not-up-to-date"}>{this.props.data["checked_change"]}</span>
          </div>
      </div>
    );
  },
});

