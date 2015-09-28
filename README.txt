Sample config server implementations and HTML UI for Timekpr

Three implementions for the 'sync' component of
the timekpr program.  See https://github.com/frohmut/timekpr.
A simple HTML UI (as a partial alternative to timekpr-gui).

- getdata.lua/setdata.lua:
  - for use the ctlmgr on the fritzbox routers
  - setup: see e.g. http://www.ip-phone-forum.de/showthread.php?t=280387
    - add external memory via usb to the fritzbox
    - enable telnet access (call #97*7*)
    - login via telnet
    - copy (e.g.) /var/html.myfritz to the usb-device
    - change /var/html.myfritz to the copy
    - add this repository as /var/html.myfritz/timekpr

- nodeserver.js/packages.json:
  - node implementations mimicing the fritzbox interface
  - runs on port 8000
  - setup:
    - npm install
    - node nodeserver.js

- getdata.php/setdata.php:
  - for use with a apache/php stack
  - setup:
    - add files unter <www-root>/timekpr
    - add rewrite-rules to macht the fritzbox-interface
      - RewriteRule "timekpr/setdata.lua" "timekpr/setdata.php"
      - RewriteRule "timekpr/getdata.lua" "timekpr/getdata.php"
    
The HTML UI is in index.html/timekpr-htmlgui.js. The react (0.13) and
the JSX-Transformer are in thee libjs directory.

