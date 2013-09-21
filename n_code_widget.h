#ifndef N_CODE_WIDGET_H
#define N_CODE_WIDGET_H

#include "n_file_tab_editor.h"

namespace Ui {
class NCodeWidget;
}

class NCodeWidget : public NFileTabEditor
{
    Q_OBJECT

public:
    explicit NCodeWidget(QWidget *parent = 0);
    ~NCodeWidget();

private:
    Ui::NCodeWidget *ui;

protected:
    virtual QWidget* createTabWidget(const QString &filePath);
    virtual QString editedFileContent(QWidget *widget);
};

#endif // N_CODE_WIDGET_H
