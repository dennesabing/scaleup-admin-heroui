import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TabNavigation, TabItem } from '@/components/ui/TabNavigation';

describe('TabNavigation', () => {
  const mockTabs: TabItem[] = [
    { id: 'tab1', label: 'Tab 1' },
    { id: 'tab2', label: 'Tab 2' },
    { id: 'tab3', label: 'Tab 3' },
  ];
  
  const mockOnTabChange = jest.fn();
  
  beforeEach(() => {
    mockOnTabChange.mockClear();
  });
  
  it('renders all tabs correctly', () => {
    render(
      <TabNavigation 
        tabs={mockTabs} 
        activeTab="tab1" 
        onTabChange={mockOnTabChange} 
      />
    );
    
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Tab 3')).toBeInTheDocument();
  });
  
  it('applies active styles to the active tab', () => {
    render(
      <TabNavigation 
        tabs={mockTabs} 
        activeTab="tab2" 
        onTabChange={mockOnTabChange} 
      />
    );
    
    const tab1 = screen.getByText('Tab 1').closest('button');
    const tab2 = screen.getByText('Tab 2').closest('button');
    const tab3 = screen.getByText('Tab 3').closest('button');
    
    expect(tab1).not.toHaveAttribute('aria-current', 'page');
    expect(tab2).toHaveAttribute('aria-current', 'page');
    expect(tab3).not.toHaveAttribute('aria-current', 'page');
    
    // Check for active class (this is a simplified check)
    expect(tab2?.className).toContain('border-primary');
    expect(tab1?.className).toContain('border-transparent');
    expect(tab3?.className).toContain('border-transparent');
  });
  
  it('calls onTabChange when a tab is clicked', () => {
    render(
      <TabNavigation 
        tabs={mockTabs} 
        activeTab="tab1" 
        onTabChange={mockOnTabChange} 
      />
    );
    
    fireEvent.click(screen.getByText('Tab 2'));
    expect(mockOnTabChange).toHaveBeenCalledWith('tab2');
    
    fireEvent.click(screen.getByText('Tab 3'));
    expect(mockOnTabChange).toHaveBeenCalledWith('tab3');
  });
  
  it('renders tabs with icons when provided', () => {
    const tabsWithIcons: TabItem[] = [
      { 
        id: 'tab1', 
        label: 'Tab 1',
        icon: <span data-testid="icon">🏠</span>
      },
      { id: 'tab2', label: 'Tab 2' }
    ];
    
    render(
      <TabNavigation 
        tabs={tabsWithIcons} 
        activeTab="tab1" 
        onTabChange={mockOnTabChange} 
      />
    );
    
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('🏠')).toBeInTheDocument();
  });
}); 