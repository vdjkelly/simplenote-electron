import React, { Component, PropTypes } from 'react';
import {
	identity,
	invoke,
} from 'lodash';

const KEY_TAB = 9;
const KEY_ENTER = 13;
const KEY_RIGHT = 39;

const startsWith = prefix => text =>
	text
		.trim()
		.toLowerCase()
		.startsWith( prefix.trim().toLowerCase() );

export class TagInput extends Component {
	static propTypes = {
		inputRef: PropTypes.func,
		onChange: PropTypes.func,
		onSelect: PropTypes.func,
		tagNames: PropTypes.arrayOf( PropTypes.string ).isRequired,
		value: PropTypes.string.isRequired,
	};

	static defaultProps = {
		inputRef: identity,
		onChange: identity,
		onSelect: identity,
	};

	componentWillUnmount() {
		this.inputField && this.inputField.removeEventListener( 'paste', this.removePastedFormatting, false );
	}

	completeSuggestion = ( andThen = identity ) => {
		const { onChange, tagNames, value } = this.props;

		if ( ! value.length ) {
			return;
		}

		const suggestion = tagNames.find( startsWith( value ) );

		if ( suggestion ) {
			onChange( suggestion, () => {
				andThen( suggestion );
				this.focusInput();
			} );
		}
	};

	focusInput = () => {
		if ( ! this.inputField ) {
			return;
		}

		const input = this.inputField;

		input.focus();
		const range = document.createRange();
		range.selectNodeContents( input );
		range.collapse( false );
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange( range );
	};

	interceptKeys = event => invoke( {
		[ KEY_ENTER ]: this.submitTag,
		[ KEY_TAB ]: this.interceptTabPress,
		[ KEY_RIGHT ]: this.interceptRightArrow,
	}, event.keyCode, event );

	interceptRightArrow = event => {
		const { value } = this.props;

		// if we aren't already at the right-most extreme
		// then don't complete the suggestion; we could
		// be moving the cursor around inside the input
		const caretPosition = window.getSelection().getRangeAt( 0 ).endOffset;
		if ( caretPosition !== value.length ) {
			return;
		}

		this.completeSuggestion();

		event.preventDefault();
		event.stopPropagation();
	};

	interceptTabPress = event => {
		this.completeSuggestion( this.submitTag );

		event.preventDefault();
		event.stopPropagation();
	};

	onChange = ( { target: { textContent: value } } ) =>
		value.endsWith( ',' ) && value.trim().length // commas should automatically insert non-zero tags
			? this.props.onSelect( value.slice( 0, -1 ).trim() )
			: this.props.onChange( value.trim() );

	removePastedFormatting = event => {
		document.execCommand(
			'insertHTML',
			false, // don't show default UI - see execCommand docs for explanation
			event.clipboardData.getData( 'text/plain' ),
		);

		event.preventDefault();
		event.stopPropagation();
	};

	storeInput = ref => {
		this.inputField = ref;
		this.props.inputRef( ref );
		this.inputField.addEventListener( 'paste', this.removePastedFormatting, false );
	};

	submitTag = event => {
		const { onSelect, value } = this.props;

		value.trim().length && onSelect( value.trim() );

		// safe invoke since event could be empty
		invoke( event, 'preventDefault' );
		invoke( event, 'stopPropagation' );
	};

	render() {
		const {
			value,
			tagNames,
		} = this.props;

		const suggestion = value.length && tagNames.find( startsWith( value ) );

		return (
			<div className="tag-input"
				onClick={ this.focusInput }
			>
				<div
					ref={ this.storeInput }
					className="tag-input__entry"
					contentEditable="true"
					onInput={ this.onChange }
					onKeyDown={ this.interceptKeys }
					placeholder="Enter a tag name…"
					suppressContentEditableWarning
				>
					{ value }
				</div>
				<div
					className="tag-input__suggestion"
					disabled
					type="text"
				>
					{ suggestion ? suggestion.substring( value.length ) : '' }
				</div>
			</div>
		);
	}
}

export default TagInput;
