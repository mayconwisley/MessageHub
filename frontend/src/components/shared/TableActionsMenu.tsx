import { MoreVert } from '@mui/icons-material';
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from '@mui/material';
import { useId, useState, type MouseEvent, type ReactNode } from 'react';

export interface TableAction {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  color?: 'default' | 'error';
}

export function TableActionsMenu({ actions }: { actions: TableAction[] }) {
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const menuId = useId();
  const open = Boolean(anchorElement);

  const close = () => setAnchorElement(null);
  const execute = (action: TableAction) => {
    close();
    action.onClick();
  };

  return (
    <>
      <Tooltip title="Ações">
        <IconButton
          aria-label="Ações da linha"
          aria-controls={open ? menuId : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-haspopup="menu"
          size="small"
          onClick={(event: MouseEvent<HTMLElement>) => setAnchorElement(event.currentTarget)}
        >
          <MoreVert fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu id={menuId} anchorEl={anchorElement} open={open} onClose={close}>
        {actions.map((action) => (
          <MenuItem key={action.label} disabled={action.disabled} onClick={() => execute(action)}>
            <ListItemIcon sx={{ color: action.color === 'error' ? 'error.main' : undefined }}>
              {action.icon}
            </ListItemIcon>
            <ListItemText sx={{ color: action.color === 'error' ? 'error.main' : undefined }}>
              {action.label}
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
