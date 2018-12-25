import React from 'react'

// Import typefaces
import 'typeface-montserrat'
import 'typeface-merriweather'

import profilePic from './profile-pic.jpg'
import { rhythm } from '../utils/typography'
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaGithub, FaDocker, FaMedium, FaFileExcel } from "react-icons/fa";

class Bio extends React.Component {
  render() {
    return (
      <div
        style={{
          display: 'flex',
          marginBottom: rhythm(2.5),
        }}
      >
        <img
          src={profilePic}
          alt={`Kyle Mathews`}
          style={{
            marginRight: rhythm(1 / 2),
            marginBottom: 0,
            borderRadius: '4%',
            width: rhythm(3),
            height: rhythm(3),
          }}
        />
        <p>
          Personal blog by <strong>Krishna Modi</strong>, a DevOps guy, talking mostly about Infrastructure as Code, Automation and fun stuff.
          <div style={{ display: 'flex', flexDirection: 'row', marginRight: '20px' }}>
            <a href="https://facebook.com/krish512/" target="_blank" rel="noopener noreferrer" style={{ boxShadow: 'none', paddingRight: '20px' }}>
              <FaFacebookF color={'#3B5998'} size={20} />
            </a>
            <a href="https://twitter.com/krish512/" target="_blank" rel="noopener noreferrer" style={{ boxShadow: 'none', padding: '0 20px' }}>
              <FaTwitter color={'#1DA1F2'} size={20} />
            </a>
            <a href="https://linkedin.com/in/krish512/" target="_blank" rel="noopener noreferrer" style={{ boxShadow: 'none', padding: '0 20px' }}>
              <FaLinkedinIn color={'#0077B5'} size={20} />
            </a>
            <a href="https://github.com/krish512/" target="_blank" rel="noopener noreferrer" style={{ boxShadow: 'none', padding: '0 20px' }}>
              <FaGithub color={'#333'} size={20} />
            </a>
            <a href="https://hub.docker.com/r/krish512/" target="_blank" rel="noopener noreferrer" style={{ boxShadow: 'none', padding: '0 20px' }}>
              <FaDocker color={'#384d54'} size={20} />
            </a>
            <a href="https://medium.com/@krish512" target="_blank" rel="noopener noreferrer" style={{ boxShadow: 'none', padding: '0 20px' }}>
              <FaMedium color={'#000'} size={20} />
            </a>
          </div>
        </p>
      </div>
    )
  }
}

export default Bio
