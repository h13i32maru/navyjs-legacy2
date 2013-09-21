#ifndef N_LAYOUT_WIDGET_H
#define N_LAYOUT_WIDGET_H

#include "n_file_tab_editor.h"

namespace Ui {
class NLayoutWidget;
}

class NLayoutWidget : public NFileTabEditor
{
    Q_OBJECT

public:
    explicit NLayoutWidget(QWidget *parent = 0);
    ~NLayoutWidget();

protected:
    virtual QWidget *createTabWidget(const QString &filePath);
    virtual QString editedFileContent(QWidget *widget);

private:
    Ui::NLayoutWidget *ui;
};

#endif // N_LAYOUT_WIDGET_H
