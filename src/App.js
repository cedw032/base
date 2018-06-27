import React, { Component } from 'react';
import './App.css';

class App extends Component {
	render() {
		return (
			<div id="app">  
				<Background />
				<Content>
					<Console />
				</Content>
			</div>
		);
	}
}

function Background({}) {
	return (
		<div className='background'>
		</div>
	);
}

function Content({children}) {
	return (
		<div className="content">
			{children}
		</div>
	);
}

function Circle({x, y, r, c}) {

}

class Window extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (<noscript/>);
	}
}

function Draggable() {

}

function WindowHeader({}) {

}

function WindowEdge({}) {

}

class Console extends Component {
	constructor(props) {
		super(props);

		var commands = {
			test: function(parameters) {
				
			},

			commands: function() {
				var commandList = Object.keys(commands).forEach((command) => {
					window.console.systemLog(command);
				}, '');
			},

			clear: function() {
				window.console.logsToIgnore = 0;
				window.console.setState({
					log: [],
					input: ''
				});
			},

			share: function(followingText) {
				if (followingText.replace(/\s/g, '').toLowerCase() == 'patchlink') {
					var {buildHistory, state} = window.console;
					var patch = buildHistory(state.log);
					var link = 'cedw032.github.io/base/build?load=' + window.btoa(patch);
					window.console.systemLog(link);
				}
			},

			load: function(patch) {
				window.console.systemLog('loading patch');
				try {
					var history = window.atob(patch.replace(/\s/g, ''));
					var {rejected, result} = window.console.runInput(history, window.console.state.log);

					if (!rejected) {
						window.console.setState(({log}) => {
							return {
								log: [...log, 
								{
									io: 'i',
									rejected: false,
									text: history
								}]
							};
						});
					}

					window.console.systemLog( rejected ? 'patch rejected: ' + result : 'patch loaded');
				} catch (e) {
					window.console.systemLog('patch failed: ' + e);
				}
			}

		}
		this.commands = commands;

		this.state = {
			log: [{
				io: 'o',
				text: 'Launching Console...'
			}],
			input: ''
		}

		this.logsToIgnore = 0;
		this.newLogs = 0;
		this.ignoredLogs = 0;

		window.devConsole = window.console;
		window.console = this;
	}

	componentDidMount = () => {
		var href = window.location.href;
		if (href.includes('?')) {
			window.console.systemLog('active link');
			try {
				href.split('?')[1].split('&').forEach((commandCall) => {
					var parts = commandCall.split('=');
					var commandName = parts[0];
					var args = parts[1];

					var command = window.console.commands[commandName];

					if (command) {
						window.console.systemLog('calling link command: ' + commandName + ' | with args: ' + args);
						command(args);
						return;
					}

					window.console.systemLog('invalid command link: ' + commandName);
				});
			} catch (e) {
				console.log('corrupted link: ' + e);
			}
		}
		window.console.systemLog('Console Loaded. Supports functional JS and commands preceeded by `:` (a colon). Try `:commands` for a list of commands' );
	}

	log = (item) => {
		
		if (this.ignoredLogs < this.logsToIgnore) {
			++this.ignoredLogs;
			return;
		}

		++this.newLogs;

		this.systemLog(item);
	}

	systemLog = (item) => {
		this.setState(({log}) => {
			return {
				log: [
					...log,
					{
						io: 'o',
						text: this.format(item)
					}
				]
			};

			setTimeout(() => {
				this.output.scrollTop = this.output.scrollHeight;
			});
		});
	} 

	format = (item) => {
		if (item === undefined) {
			return 'undefined';
		}
		
		if (item === null) {
			return 'null';
		} 

		try {
			return JSON.stringify(item);
		} catch (e) {
			return item.toString();
		}

	}

	onKeyDown = (e) => {
		if (e.key === 'Enter')
		{
			var logItem = {
				io: 'i',
				rejected: true
			}

			this.setState(({log, input}) => {

				input = input === '' ? ' ' : input;

				setTimeout(() => {
					this.output.scrollTop = this.output.scrollHeight;

					if (this.tryRunCommand(input)) {
						return;
					}

					logItem.rejected = false;

					var {result, rejected} = this.runInput(input, log);
					logItem.rejected = rejected;

					this.setState(({log}) => {

						setTimeout(() => {
							this.output.scrollTop = this.output.scrollHeight;
						});

						return {
							log: [
								...log,
								{
									io: 'o',
									text: result,
									error: rejected
								}
							]
						};
					})
				});

				this.selectAllInput();

				logItem.text = input;

				return {
					log: [
						...log,
						logItem
					]
				};
			})
		}
	}

	selectAllInput = () => {
		this.input.setSelectionRange(0, this.input.value.length)
	}

	tryRunCommand = (input) => {
		if (input.charAt(0) !== ':') {
			return false;
		}

		input = input.substring(1, input.length);
		var tokens = input.split(' ');
		var commandToken = tokens.shift();

		var command = this.commands[commandToken];

		if (command) {
			command(tokens.join(' '));
			return true;
		}

		this.systemLog('command not found');
		return true;
	}

	error = (text) => {
		this.setState(({log}) => {
			return {
				log: [
					...log,
					{
						io: 'o',
						error: true,
						text: this.format(text)
					}
				]
			};
		});
	}

	buildHistory = (log) => {
		return log.filter((logItem) => {
			return logItem.io === 'i' && !logItem.rejected;
		}).map((logItem) => {
			return logItem.text;
		}).join(';');
	}

	runInput = (input, log) => {

		var toRun = this.buildHistory(log) + ';undefined;' + input;

		var rejected = false;
		var result;

		try {
			this.logsToIgnore += this.newLogs;
			this.newLogs = 0;
			this.ignoredLogs = 0;
			result = this.format(eval(toRun));
		} catch (e) {
			rejected = true;
			result = e.toString();
		}

		return {result, rejected};
	}

	onChange = ({target: {value}}) => {
		this.setState({ input: value });
	}

	render() {

		const {log} = this.state;
		const input = this.state.input;

		return (
			<div className='console'>
				<div className='console-output' ref={el => this.output = el}>
					{log.map((logItem, i) => {
						return (
							<LogItem {...logItem} key={i} />
						);
					})}
				</div>
				<input 
					type='text' 
					className={'console-input'}
					onKeyDown={this.onKeyDown} 
					onChange={this.onChange}
					value={input}
					tabIndex={0}
					ref={el => this.input = el} />
			</div>
		);
	}
}

function LogItem({io, text, error}) {

	var className = 'log-item ' + { i: 'item-in', o: 'item-out' }[io];
	className += error ? ' error' : '';
	return (
		<div className={className}>
			{text}
		</div>
	);
}

function DemoParagraph({}) {
	return (
		<p>
			This is some test content for my website.  It is mostly required to fill space for look and feel testing, however has the added bonus of having a cathartic effect to type, 
			allowing me to speak my mind freely.  Some sentences are short, and some sentences are long.  Some are in between.  Hopefully this is enough content for now, however I intend to write more
			in the future.
		</p>
	);
}

function Palette({}) {
	return (
		<div className='palette'>
			<Swatch index={1} />
			<Swatch index={2} />
			<Swatch index={3} />
			<Swatch index={4} />
			<Swatch index={5} />
			<Swatch index={6} />
			<Swatch index={7} />
		</div>
	);
}

function Swatch({index}) {
	return ( 
		<div className={'swatch background-shade-' + index} />
	);
}



export default App;
