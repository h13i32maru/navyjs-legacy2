#ifndef N_FILE_WIDGET_H
#define N_FILE_WIDGET_H

#include <QWidget>
#include <QDir>

class NFileWidget : public QWidget
{
    Q_OBJECT
public:
    explicit NFileWidget(const QDir &projectDir, const QString &filePath, QWidget *parent = 0);
    bool isChanged();
    virtual bool save() = 0;

protected:
    QDir mProjectDir;
    QString mFilePath;
    bool mChanged;

protected slots:
    void changed();

signals:
    void changed(const QString &filePath);
};

#endif // N_FILE_WIDGET_H
