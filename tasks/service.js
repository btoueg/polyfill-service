// Generated by CoffeeScript 1.9.1

/*
(c) js.seth.h@gmail.com
MIT License
 */

(function() {
  var existProcess, fs, log, loopUntil;

  fs = require('fs');

  log = void 0;

  existProcess = function(pid) {
    var err;
    try {
      process.kill(pid, 0);
    } catch (_error) {
      err = _error;
      return false;
    }
    return true;
  };

  loopUntil = function(fnEndOk, done) {
    var loopId;
    return loopId = setInterval(function() {
      if (true === fnEndOk()) {
        clearInterval(loopId);
        return done();
      }
    }, 200);
  };

  module.exports = function(grunt) {
    var child_process;
    child_process = require('child_process');
    log = grunt.log;
    return grunt.registerMultiTask('service', 'background service', function(arg1) {
      var data, done, killByPid, options, self, start, target;
      if (arg1 == null) {
        arg1 = 'start';
      }
      self = this;
      target = this.target;
      data = this.data;
      options = this.options({
        failOnError: false,
        stdio: 'pipe'
      });
      done = this.async();
      killByPid = function(callback) {
        var err, pid;
        if (!fs.existsSync(data.pidFile)) {
          log.writeln("[Service] " + target + " - pid file not exists");
          if (data.failOnError) {
            return;
          } else {
            return callback();
          }
        }
        pid = parseInt(fs.readFileSync(data.pidFile));
        log.writeln("[Service] " + target + "(pid=" + pid + ") is killing ");
        try {
          process.kill(pid);
        } catch (_error) {
          err = _error;
          log.writeln("[Service] " + target + "(pid=" + pid + ") does not exists.");
          return callback();
        }
        return loopUntil(function() {
          return !existProcess(pid);
        }, function() {
          log.writeln("[Service] " + target + "(pid=" + pid + ") is killed.");
          return callback();
        });
      };
      start = function(callback) {
        var _closed, _spawned, args, command, pid, proc, shellCommand;

		    var buffer = "";
		    var hasStarted = false;

        _spawned = function() {
          return callback();
        };
        _closed = function() {};
        if (data.blocking) {
          _spawned = function() {};
          _closed = function() {
            return callback();
          };
        }
        if (data.pidFile) {
          if (fs.existsSync(data.pidFile)) {
            pid = parseInt(fs.readFileSync(data.pidFile));
            if (existProcess(pid)) {
              log.writeln("[Service] " + target + "(pid=" + pid + ") is still running.");
              if (data.failOnError) {
                return;
              }
              return killByPid(function() {
                return start(callback);
              });
            }
          }
        }
        command = data.command;
        if (data.shellCommand != null) {
          shellCommand = data.shellCommand;
          if (process.platform === "win32") {
            command = "cmd.exe";
            args = ["/s", "/c", shellCommand.replace(/\//g, "\\")];
            options.windowsVerbatimArguments = true;
          } else {
            command = "/bin/sh";
            args = ["-c", shellCommand];
          }
        } else {
          args = data.args;
        }
        proc = child_process.spawn(command, args, options);
        log.writeln("[Service] " + target + " is starting.");
        if (proc.stdout) {
          proc.stdout.on('data', function(d) {
			  if (!hasStarted) {
				  buffer += d.toString();
				  if (buffer.indexOf("listening") >= 0) {
					  hasStarted = true;
				  }
			  }
            return log.writeln(d);
          });
        }
        if (proc.stderr) {
          proc.stderr.on('data', function(d) {
            return log.writeln(d);
          });
        }
        if (proc) {
          log.writeln("[Service] Child PID = " + proc.pid);
          proc.on('close', function(code) {
            log.writeln('child process exited with code ', arguments);
            return _closed();
          });
          proc.on('error', function() {
            return log.writeln('error', arguments);
          });
          proc.on('exit', function() {
            return log.writeln('exit', arguments);
          });
          proc.on('close', function() {
            return log.writeln('close', arguments);
          });
          proc.on('disconnect', function() {
            return log.writeln('disconnect', arguments);
          });
        }
        if (data.generatePID && data.pidFile) {
          log.writeln("[Service] Wrote PID to " + data.pidFile);
          fs.writeFile(data.pidFile, proc.pid);
        }
        if (data.pidFile) {
          return loopUntil(function() {
            return fs.existsSync(data.pidFile) && hasStarted;
          }, function() {
            pid = parseInt(fs.readFileSync(data.pidFile));
            log.writeln("[Service] " + target + "(pid=" + pid + ") is started.");
            return _spawned();
          });
        } else {
          log.writeln("[Service] " + target + " is started.");
          return _spawned();
        }
      };
      switch (arg1) {
        case "stop":
          return killByPid(function() {
            return done();
          });
        case "restart":
          return killByPid(function() {
            return start(function() {
              return done();
            });
          });
        case "start":
          return start(function() {
            return done();
          });
      }
    });
  };

}).call(this);
