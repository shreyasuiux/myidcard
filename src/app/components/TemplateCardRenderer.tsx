import { forwardRef } from 'react';
import type { EmployeeRecord } from '../utils/employeeStorage';
import type {
  Template,
  TemplateDesign,
  BackSideText,
  Branch,
  FrontSideText,
} from '../utils/templateData';
import { resolveTemplateDesign } from '../utils/templateData';
import { DEFAULT_BACK_TEXT } from '../utils/defaultBackText';
import { DEFAULT_FRONT_TEXT } from '../utils/defaultFrontText';
import {
  formatName,
  getNameFontSize,
  formatPhoneNumber,
  formatValidTill,
  formatJoiningDate,
  formatEmployeeId,
  formatBloodGroup,
} from '../utils/cardFormatters';
import logo from 'figma:asset/6dce495d999ed88e54f35e49635962b824088162.png';

// ─────────────────────────────────────────────────
// Card dimensions — immutable constants
// ─────────────────────────────────────────────────
export const CARD_WIDTH = 153;
export const CARD_HEIGHT = 244;
const LOGO_ASPECT = 42 / 20; // width / height

// ─────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────
export interface TemplateCardRendererProps {
  employee: EmployeeRecord;
  side: 'front' | 'back';
  template: Template;
  photoUrl?: string;
  scale?: number;
}

/**
 * TemplateCardRenderer — THE SINGLE SOURCE OF TRUTH
 *
 * Every ID card surface in the application (preview, grid,
 * export, design-editor preview) MUST render through this
 * component.  It reads ALL layout data from the template
 * object and hardcodes nothing.
 *
 * Animations, zoom chrome, photo-edit overlays, and other
 * interactive affordances belong in wrapper components,
 * NOT here.
 */
export const TemplateCardRenderer = forwardRef<HTMLDivElement, TemplateCardRendererProps>(
  ({ employee, side, template, photoUrl, scale = 1 }, ref) => {
    const design: TemplateDesign = side === 'front' ? template.front : template.back;
    const resolved = resolveTemplateDesign(design);
    const frontText: FrontSideText = template.frontText || DEFAULT_FRONT_TEXT;

    // ── helpers ────────────────────────────────

    const s = (v: number) => v * scale;
    const px = (v: number) => `${v * scale}px`;

    const imgUrl = photoUrl || employee.photoBase64 || '';

    // Background (solid or gradient)
    const bgStyle: React.CSSProperties = resolved.backgroundColor.includes('gradient')
      ? { backgroundImage: resolved.backgroundColor }
      : { backgroundColor: resolved.backgroundColor };

    // Photo border-radius
    const photoBR =
      resolved.photoShape === 'circle'
        ? '50%'
        : resolved.photoShape === 'rounded'
          ? '4px'
          : '0px';

    // ── background pattern ─────────────────────

    const renderPattern = () => {
      if (!resolved.backgroundPattern || resolved.backgroundPattern === 'none') return null;
      const base: React.CSSProperties = {
        position: 'absolute',
        inset: 0,
        opacity: 0.05,
        pointerEvents: 'none',
      };
      if (resolved.backgroundPattern === 'dots') {
        return (
          <div
            style={{
              ...base,
              backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
              backgroundSize: `${s(8)}px ${s(8)}px`,
            }}
          />
        );
      }
      if (resolved.backgroundPattern === 'lines') {
        return (
          <div
            style={{
              ...base,
              backgroundImage: `repeating-linear-gradient(45deg, currentColor 0, currentColor ${s(1)}px, transparent ${s(1)}px, transparent ${s(6)}px)`,
            }}
          />
        );
      }
      return null;
    };

    // ── accent elements ────────────────────────

    const renderAccents = () =>
      resolved.accentElements.map((el, i) => {
        const common: React.CSSProperties = {
          position: 'absolute',
          left: px(el.position.x),
          top: px(el.position.y),
          width: px(el.size.width),
          height: px(el.size.height),
          backgroundColor: el.color,
        };
        if (el.type === 'circle') return <div key={`a-${i}`} style={{ ...common, borderRadius: '50%' }} />;
        return <div key={`a-${i}`} style={common} />;
      });

    // ── logo ───────────────────────────────────

    const renderLogo = (pos: { x: number; y: number }, size: number) => {
      if (resolved.showLogo === false) return null;
      const w = size;
      const h = w / LOGO_ASPECT;
      return (
        <div
          style={{
            position: 'absolute',
            left: px(pos.x),
            top: px(pos.y),
            width: px(w),
            height: px(h),
          }}
        >
          <img
            src={logo}
            alt="Logo"
            style={{
              position: 'absolute',
              inset: 0,
              maxWidth: 'none',
              objectFit: 'contain',
              pointerEvents: 'none',
              width: '100%',
              height: '100%',
            }}
          />
        </div>
      );
    };

    // ═══════════════════════════════════════════
    //  FRONT SIDE
    // ═══════════════════════════════════════════
    if (side === 'front') {
      const ns = resolved.nameStyle;
      const es = resolved.employeeIdStyle;
      const cr = resolved.contactRowStyle;
      const vt = resolved.validTillStyle;
      const jd = resolved.joiningDateStyle;

      return (
        <div
          ref={ref}
          style={{
            width: px(CARD_WIDTH),
            height: px(CARD_HEIGHT),
            position: 'relative',
            overflow: 'hidden',
            fontFamily: 'Roboto, sans-serif',
            ...bgStyle,
          }}
        >
          {renderPattern()}
          {renderAccents()}

          {/* LOGO */}
          {renderLogo(resolved.logoPosition, resolved.logoSize)}

          {/* PHOTO */}
          {resolved.showPhoto !== false && resolved.photoSize.width > 0 && (
            <div
              data-photo-container="true"
              style={{
                position: 'absolute',
                left: px(resolved.photoPosition.x),
                top: px(resolved.photoPosition.y),
                width: px(resolved.photoSize.width),
                height: px(resolved.photoSize.height),
                overflow: 'hidden',
                borderRadius: photoBR,
              }}
            >
              {imgUrl ? (
                <img
                  data-employee-photo="true"
                  src={imgUrl}
                  alt="Employee"
                  crossOrigin="anonymous"
                  style={{
                    display: 'block',
                    width: px(resolved.photoSize.width),
                    height: px(resolved.photoSize.height),
                    objectFit: 'cover',
                    objectPosition: 'center',
                  }}
                />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#f1f5f9',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'Roboto, sans-serif',
                      fontSize: px(8),
                      lineHeight: px(12),
                      color: '#94a3b8',
                    }}
                  >
                    No photo
                  </p>
                </div>
              )}
            </div>
          )}

          {/* NAME */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: px(ns.position.y),
              width: px(CARD_WIDTH),
              paddingLeft: px(12),
              paddingRight: px(12),
              display: 'flex',
              alignItems: 'flex-start',
            }}
          >
            <p
              style={{
                flex: 1,
                textAlign: 'center',
                whiteSpace: 'pre-wrap',
                fontFamily: 'Roboto, sans-serif',
                fontSize: px(getNameFontSize(employee.name, ns.fontSize)),
                fontWeight: 'bold',
                lineHeight: 1.3,
                color: ns.color,
                minWidth: '1px',
                minHeight: '1px',
              }}
            >
              {formatName(employee.name)}
            </p>
          </div>

          {/* EMPLOYEE ID */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: px(es.position.y),
              width: px(CARD_WIDTH),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <p
              style={{
                textAlign: 'center',
                fontFamily: 'Roboto, sans-serif',
                fontSize: px(es.fontSize),
                fontWeight: 'bold',
                lineHeight: 1.4,
                color: es.color,
                whiteSpace: 'nowrap',
              }}
            >
              Emp ID : {formatEmployeeId(employee.employeeId)}
            </p>
          </div>

          {/* CONTACT ROW */}
          {/* Phone */}
          <div
            style={{
              position: 'absolute',
              left: px(cr.items.phone.x),
              top: px(cr.y),
              height: px(cr.height),
            }}
          >
            <p
              style={{
                fontFamily: 'Roboto, sans-serif',
                fontSize: px(cr.fontSize),
                fontWeight: cr.fontWeight,
                lineHeight: px(cr.height),
                color: cr.color,
              }}
            >
              {formatPhoneNumber(employee.mobile)}
            </p>
          </div>

          {/* Pipe 1 */}
          <div
            style={{
              position: 'absolute',
              left: px(cr.items.pipe1.x),
              top: px(cr.y),
              height: px(cr.height),
            }}
          >
            <p
              style={{
                fontFamily: 'Roboto, sans-serif',
                fontSize: px(cr.fontSize),
                fontWeight: cr.fontWeight,
                lineHeight: px(cr.height),
                color: cr.color,
              }}
            >
              |
            </p>
          </div>

          {/* Blood Group */}
          <div
            style={{
              position: 'absolute',
              left: px(cr.items.bloodGroup.x),
              top: px(cr.y),
              width: px(cr.items.bloodGroup.width),
              height: px(cr.height),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <p
              style={{
                fontFamily: 'Roboto, sans-serif',
                fontSize: px(cr.fontSize),
                fontWeight: cr.fontWeight,
                lineHeight: px(cr.height),
                color: cr.color,
                textAlign: 'center',
              }}
            >
              {formatBloodGroup(employee.bloodGroup)}
            </p>
          </div>

          {/* Pipe 2 */}
          <div
            style={{
              position: 'absolute',
              left: px(cr.items.pipe2.x),
              top: px(cr.y),
              height: px(cr.height),
            }}
          >
            <p
              style={{
                fontFamily: 'Roboto, sans-serif',
                fontSize: px(cr.fontSize),
                fontWeight: cr.fontWeight,
                lineHeight: px(cr.height),
                color: cr.color,
              }}
            >
              |
            </p>
          </div>

          {/* Field 1 (website / designation / etc.) */}
          <div
            style={{
              position: 'absolute',
              left: px(cr.items.field1.x),
              top: px(cr.y),
              height: px(cr.height),
            }}
          >
            <p
              style={{
                fontFamily: 'Roboto, sans-serif',
                fontSize: px(cr.fontSize),
                fontWeight: cr.fontWeight,
                lineHeight: px(cr.height),
                color: cr.color,
              }}
            >
              {employee.website || 'www.acc.ltd'}
            </p>
          </div>

          {/* VALID TILL */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: px(vt.y),
              width: px(CARD_WIDTH),
              height: px(vt.height),
            }}
          >
            <p
              style={{
                position: 'absolute',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                fontFamily: 'Roboto, sans-serif',
                fontSize: px(vt.fontSize),
                lineHeight: px(vt.height),
                color: vt.color,
                left: '50%',
                top: px(0.25),
                transform: 'translateX(-50%)',
              }}
            >
              Valid till {formatValidTill(employee.validTill)}
            </p>
          </div>

          {/* JOINING DATE (rotated side text) */}
          <div
            style={{
              position: 'absolute',
              left: px(jd.x),
              top: px(jd.y),
              width: px(jd.width),
              height: px(jd.height),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ transform: `rotate(${jd.rotation}deg)`, flexShrink: 0 }}>
              <p
                style={{
                  fontFamily: 'Roboto, sans-serif',
                  fontSize: px(jd.fontSize),
                  lineHeight: px(jd.height),
                  color: jd.color,
                }}
              >
                {formatJoiningDate(employee.joiningDate)}
              </p>
            </div>
          </div>
        </div>
      );
    }

    // ═══════════════════════════════════════════
    //  BACK SIDE
    // ═══════════════════════════════════════════

    const backText: BackSideText = template.backText || DEFAULT_BACK_TEXT;

    // Branch vertical layout — starts at 124, each slot is 40px
    const branchTops: number[] = [];
    let bTop = 124;
    for (let i = 0; i < backText.branches.length; i++) {
      branchTops.push(bTop);
      bTop += 40;
    }

    return (
      <div
        ref={ref}
        style={{
          width: px(CARD_WIDTH),
          height: px(CARD_HEIGHT),
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'Roboto, sans-serif',
          ...bgStyle,
        }}
      >
        {renderPattern()}
        {renderAccents()}

        {/* Logo — centered via translateX(-50%) */}
        {resolved.showLogo !== false && (
          <div
            style={{
              position: 'absolute',
              height: px(resolved.logoSize / LOGO_ASPECT),
              left: `calc(50% + ${s(0.5)}px)`,
              top: px(24),
              width: px(resolved.logoSize),
              transform: 'translateX(-50%)',
            }}
          >
            <img
              alt="Logo"
              style={{
                position: 'absolute',
                inset: 0,
                maxWidth: 'none',
                objectFit: 'contain',
                pointerEvents: 'none',
                width: '100%',
                height: '100%',
              }}
              src={logo}
            />
          </div>
        )}

        {/* Headquarter Label */}
        <p
          style={{
            position: 'absolute',
            fontFamily: 'Roboto, sans-serif',
            fontSize: px(7),
            fontWeight: 'bold',
            lineHeight: px(9),
            left: px(15),
            top: px(63),
            fontStyle: 'normal',
            color: '#0f172a',
          }}
        >
          {backText.headquarterLabel}
        </p>

        {/* Location Label */}
        <p
          style={{
            position: 'absolute',
            fontFamily: 'Roboto, sans-serif',
            fontSize: px(7),
            fontWeight: 'bold',
            lineHeight: px(9),
            left: px(15),
            top: px(78),
            fontStyle: 'normal',
            color: '#0f172a',
          }}
        >
          {backText.headquarterLocation}{' '}
        </p>

        {/* Headquarter Address */}
        <p
          style={{
            position: 'absolute',
            fontFamily: 'Roboto, sans-serif',
            fontSize: px(6),
            fontWeight: 'normal',
            lineHeight: px(9),
            left: px(42),
            top: px(78),
            width: px(101),
            fontStyle: 'normal',
            color: '#0f172a',
            whiteSpace: 'pre-wrap',
          }}
        >
          {backText.headquarterAddress}
        </p>

        {/* Branches Label */}
        <p
          style={{
            position: 'absolute',
            fontFamily: 'Roboto, sans-serif',
            fontSize: px(7),
            fontWeight: 'bold',
            lineHeight: px(9),
            left: px(15),
            top: px(110),
            fontStyle: 'normal',
            color: '#0f172a',
          }}
        >
          {backText.branchesLabel}
        </p>

        {/* Dynamic Branches */}
        {backText.branches.map((branch: Branch, idx: number) => (
          <div key={branch.id || idx}>
            {/* Branch Label */}
            <p
              style={{
                position: 'absolute',
                fontFamily: 'Roboto, sans-serif',
                fontSize: px(7),
                fontWeight: 'bold',
                lineHeight: px(9),
                left: px(15),
                top: px(branchTops[idx]),
                fontStyle: 'normal',
                color: '#0f172a',
              }}
            >
              {branch.label}
            </p>

            {/* Branch Address */}
            <p
              style={{
                position: 'absolute',
                fontFamily: 'Roboto, sans-serif',
                fontSize: px(6),
                fontWeight: 'normal',
                lineHeight: px(9),
                left: px(48),
                top: px(branchTops[idx]),
                width: px(97),
                fontStyle: 'normal',
                color: '#0f172a',
                whiteSpace: 'pre-wrap',
              }}
            >
              {branch.address}
            </p>
          </div>
        ))}
      </div>
    );
  },
);

TemplateCardRenderer.displayName = 'TemplateCardRenderer';