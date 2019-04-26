import React from 'react';

import { validate } from 'actions';

export default class Verification extends React.Component {
  state = {
    msg: ""
  }

  async componentDidMount() {
    var search = this.props.location.search;
    const queryString = this.checkUrl(search);
    
    if(queryString) {
      try {
        await validate(queryString.security_code)
        this.props.history.push('/login')
      } catch (e) {
        this.setState({
          msg: "Cannot validate your account"
        })
      }
    } 


  }

  checkUrl = (query) => {
    try {
      const q = query && JSON.parse('{"' + decodeURI(query.substring(1)).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
      return q;
    } catch (e) {
      return false
    }
  }

  render() {
    return (
      <div>
        <h2>{this.state.msg ? <div className="alert alert-danger"> {this.state.msg}</div> : "Verifiying"}</h2>
      </div>
    )
  }
}