import React from 'react';

const Footer = () => {
  return (
    <footer className="footer footer-transparent d-print-none">
      <div className="container-xl">
        <div className="row text-center align-items-center flex-row-reverse">
          <div className="col-lg-auto ms-lg-auto">
            <ul className="list-inline list-inline-dots mb-0">
              <li className="list-inline-item">
                <a
                  href="https://github.com/WorldFishCenter/peskas.zanzibar.portal/blob/main/LICENSE.md"
                  className="link-secondary"
                >
                  License
                </a>
              </li>
              <li className="list-inline-item">
                <a
                  href="https://github.com/WorldFishCenter/peskas.zanzibar.portal"
                  className="link-secondary"
                >
                  Code
                </a>
              </li>
            </ul>
          </div>
          <div className="col-12 col-lg-auto mt-3 mt-lg-0">
            <ul className="list-inline list-inline-dots mb-0">
              <li className="list-inline-item">Last update {new Date().toLocaleDateString()}</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
